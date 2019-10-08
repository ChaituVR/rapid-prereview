import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import identifiersArxiv from 'identifiers-arxiv';
import doiRegex from 'doi-regex';
import { format } from 'date-fns';
import { unprefix } from '../utils/jsonld';
import { createError } from '../utils/errors';
import Value from './value';
import { useUser } from '../contexts/user-context';
import { usePostAction } from '../hooks/api-hooks';

export default function NewPreprint({ onCancel }) {
  const [user] = useUser();

  const [progress, setProgress] = useState({
    status: 'iddle',
    message: '',
    error: null
  });

  const [value, setValue] = useState('');

  const [identifier, setIdentifier] = useState('');

  const [preprint, setPreprint] = useState(null);

  const [post, postData] = usePostAction();

  console.log(postData);

  useEffect(() => {
    if (identifier) {
      setProgress({
        status: 'resolving',
        message: `resolving ${identifier}`,
        error: null
      });

      const controller = new AbortController();

      fetch(`/api/resolve?identifier=${encodeURIComponent(identifier)}`, {
        signal: controller.signal
      })
        .then(resp => {
          if (resp.ok) {
            return resp.json();
          } else {
            return resp.json().then(
              body => {
                throw createError(resp.status, body.description || body.name);
              },
              err => {
                throw createError(resp.status, 'something went wrong');
              }
            );
          }
        })
        .then(data => {
          setPreprint(data);
          setProgress({ status: 'resolved', message: '', error: null });
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setProgress({ status: 'error', error: err, message: '' });
          }
          setPreprint(null);
        });

      return () => {
        controller.abort();
      };
    } else {
      setProgress({
        status: 'iddle',
        message: '',
        error: null
      });
    }
  }, [identifier]);

  return (
    <div className="new-preprint">
      <label htmlFor="new-preprint-input">
        Enter a <abbr title="Digital Object Identifier">DOI</abbr> or an arXiv
        ID
      </label>
      <input
        id="new-preprint-input"
        type="text"
        autoComplete="off"
        onChange={e => {
          const value = e.target.value;
          const [arxivId] = identifiersArxiv.extract(value);
          let nextIdentifier;
          if (arxivId) {
            nextIdentifier = `arXiv:${arxivId}`;
          } else {
            const doiMatch = value.match(doiRegex());
            const doi = doiMatch && doiMatch[0];
            if (doi) {
              nextIdentifier = `doi:${doi}`;
            } else {
              nextIdentifier = '';
            }
          }

          if (nextIdentifier !== identifier) {
            setIdentifier(nextIdentifier);
            setPreprint(null);
          }

          setValue(value);
        }}
        value={value}
      />

      {!!identifier && (
        <span>
          {identifier.split(':')[0]}: {unprefix(identifier)}
        </span>
      )}

      <button
        onClick={e => {
          setValue('');
          setIdentifier('');
          setPreprint(null);
          setProgress({ status: 'iddle', message: '', error: null });
          onCancel();
        }}
      >
        Cancel
      </button>

      {progress.status === 'resolved' && preprint ? (
        <div>
          {!!preprint.name && <Value tagName="h2">{preprint.name}</Value>}

          {!!preprint.datePosted && (
            <span>{format(new Date(preprint.datePosted), 'MMM. d, yyyy')}</span>
          )}
          {!!(preprint.preprintServer && preprint.preprintServer.name) && (
            <Value tagName="span">{preprint.preprintServer.name}</Value>
          )}
        </div>
      ) : progress.message ? (
        <p>{progress.message}</p>
      ) : progress.error ? (
        <p>
          Error:{' '}
          {progress.error.message ||
            progress.error.name ||
            progress.error.statusCode}
        </p>
      ) : null}

      <button
        onClick={e => {
          post({
            '@type': 'Action'
          });
        }}
        disabled={!identifier || progress.status !== 'resolved'}
      >
        Request reviews
      </button>
      <button
        onClick={e => {
          // TODO
        }}
        disabled={!identifier || progress.status !== 'resolved'}
      >
        Add review
      </button>
    </div>
  );
}

NewPreprint.propTypes = {
  onCancel: PropTypes.func.isRequired
};

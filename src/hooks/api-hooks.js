import { useState, useEffect, useRef } from 'react';
import noop from 'lodash/noop';
import { createError } from '../utils/errors';
import { unprefix, getId, arrayify } from '../utils/jsonld';
import { createPreprintId } from '../utils/ids';
import { preprintsWithActionsStore } from '../stores/preprint-stores';

// TODO stores directory each store inherit from EventEmitter and store object in LRU
// addListenner and removeListenner in useEffect

/**
 * Use to POST an Action to the API and keep track of the request progress /
 * error
 */
export function usePostAction() {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const controllerRef = useRef(null);

  const [state, setState] = useState({
    isActive: false,
    error: null,
    body: null
  });

  // Note: `onSuccess` and `onError` are only called if the component is still
  // mounted
  function post(action, onSuccess = noop, onError = noop) {
    if (isMounted.current) {
      setState({
        isActive: true,
        error: null,
        body: action
      });
    }

    const controller = new AbortController();
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = controller;

    fetch('/api/action', {
      signal: controller.signal,
      method: 'POST',
      body: JSON.stringify(action),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
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
      .then(body => {
        preprintsWithActionsStore.upsertAction(action);
        if (isMounted.current) {
          setState({ isActive: false, error: null, body });
          onSuccess(body);
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError' && isMounted.current) {
          setState({ isActive: false, error, body: action });
          onError(error);
        }
      });
  }

  return [post, state];
}

/**
 * Get Preprint metadata from `identifier`
 */
export function usePreprint(
  identifier, // arXivId or DOI
  prefetchedPreprint
) {
  identifier = unprefix(identifier);

  const [progress, setProgress] = useState({
    isActive: false,
    error: null
  });

  const [preprint, setPreprint] = useState(null);

  useEffect(() => {
    if (identifier) {
      let cached;
      if (
        prefetchedPreprint &&
        unprefix(prefetchedPreprint.doi || prefetchedPreprint.arXivId) ===
          identifier
      ) {
        cached = prefetchedPreprint;
      } else if (preprintsWithActionsStore.has(identifier)) {
        cached = preprintsWithActionsStore.get(identifier, { actions: false });
      }

      if (cached) {
        setProgress({
          isActive: false,
          error: null
        });
        setPreprint(cached);
      } else {
        setProgress({
          isActive: true,
          error: null
        });
        setPreprint(null);

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
            preprintsWithActionsStore.set(data, {
              onlyIfNotExisting: true,
              emit: false
            });
            setPreprint(data);
            setProgress({ isActive: false, error: null });
          })
          .catch(err => {
            if (err.name !== 'AbortError') {
              setProgress({ isActive: false, error: err });
              setPreprint(null);
            }
          });

        return () => {
          controller.abort();
        };
      }
    } else {
      setProgress({
        isActive: false,
        error: null
      });
      setPreprint(null);
    }
  }, [identifier, prefetchedPreprint]);

  return [preprint, progress];
}

/**
 * Get all the `RapidPREreviewAction` and `RequestForRapidPREreviewAction`
 * associated with a preprint
 */
export function usePreprintActions(identifier) {
  const [progress, setProgress] = useState({
    isActive: false,
    error: null
  });

  const [actions, setActions] = useState([]);

  useEffect(() => {
    if (identifier) {
      setProgress({
        isActive: true,
        error: null
      });
      setActions(preprintsWithActionsStore.getActions(identifier));

      const controller = new AbortController();

      fetch(`/api/preprint/${unprefix(createPreprintId(identifier))}`, {
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
          preprintsWithActionsStore.set(data);
          setActions(arrayify(data.potentialAction));
          setProgress({ isActive: false, error: null });
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setProgress({ isActive: false, error: err });
          }
          setActions([]);
        });

      return () => {
        setProgress({ isActive: false, error: null });
        setActions([]);
        controller.abort();
      };
    } else {
      setProgress({
        isActive: false,
        error: null
      });
      setActions([]);
    }
  }, [identifier]);

  return [actions, progress];
}

const defaultResults = {
  bookmark: null,
  rows: [],
  total_rows: 0,
  counts: {}
};

/**
 * Get all the `RapidPREreviewAction` and `RequestForRapidPREreviewAction`
 * associated with a preprint
 */
export function usePreprintSearchResults(
  search // the ?qs part of the url
) {
  if (!search || search === '?') {
    search = `?q=*:*&sort=${JSON.stringify([
      '-score<number>',
      '-datePosted<number>'
    ])}&include_docs=true&counts=${JSON.stringify([
      'hasData',
      'hasCode',
      'hasReviews',
      'hasRequests',
      'subjectName'
    ])}`;
  }

  const [progress, setProgress] = useState({
    isActive: false,
    error: null
  });

  const [results, setResults] = useState(defaultResults);

  useEffect(() => {
    // keep `results` up-to-date
    function update(preprint) {
      if (
        arrayify(results.rows).some(row => getId(row.doc) === getId(preprint))
      ) {
        setResults(prevResults => {
          return Object.assign({}, prevResults, {
            rows: arrayify(prevResults.rows).map(row => {
              if (!row.doc || getId(row.doc) !== getId(preprint)) {
                return row;
              }
              return Object.assign({}, row, { doc: preprint });
            })
          });
        });
      }
    }

    preprintsWithActionsStore.addListener('SET', update);

    return () => {
      preprintsWithActionsStore.removeListener('SET', update);
    };
  }, [results]);

  useEffect(() => {
    setProgress({
      isActive: true,
      error: null
    });
    setResults(defaultResults);

    const controller = new AbortController();

    fetch(`/api/preprint/${search}`, {
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
        arrayify(data.rows).forEach(row => {
          if (row.doc) {
            preprintsWithActionsStore.set(row.doc, { emit: false });
          }
        });

        setResults(data);
        setProgress({ isActive: false, error: null });
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setProgress({ isActive: false, error: err });
        }
        setResults(defaultResults);
      });

    return () => {
      setProgress({ isActive: false, error: null });
      controller.abort();
    };
  }, [search]);

  return [results, progress];
}

// TODO useRole(roleId)
// one per role and cache server side

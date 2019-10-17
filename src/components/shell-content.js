import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useUser } from '../contexts/user-context';
import { usePreprintActions, usePostAction } from '../hooks/api-hooks';
import RapidPreReviewLogo from './rapid-pre-review-logo';
import Controls from './controls';
import Button from './button';
import RapidFormFragment from './rapid-form-fragment';
import {
  getReviewAnswers,
  checkIfAllAnswered,
  checkIfHasReviewed,
  checkIfHasRequested
} from '../utils/actions';
import { getId } from '../utils/jsonld';
import { createPreprintIdentifierCurie } from '../utils/ids';
import LoginRequiredModal from './login-required-modal';
import { getYesNoStats, getTextAnswers } from '../utils/stats';
import Barplot from './barplot';
import TextAnswers from './text-answers';
import { getDefaultRole } from '../utils/users';

export default function ShellContent({ preprint, defaultTab = 'read' }) {
  const [user] = useUser();

  const [actions, fetchActionsProgress] = usePreprintActions(
    preprint.doi || preprint.arXivId
  );

  const [post, postProgress] = usePostAction();

  const [tab, setTab] = useState(defaultTab);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const hasReviewed = checkIfHasReviewed(user, actions);
  const hasRequested = checkIfHasRequested(user, actions);

  return (
    <div className="shell-content">
      <header>
        <RapidPreReviewLogo />
        <nav>
          <ul>
            <li>
              <Button
                disabled={postProgress.isActive}
                onClick={() => setTab('read')}
              >
                Read reviews
              </Button>
            </li>
            <li>
              <Button
                disabled={postProgress.isActive || hasReviewed}
                onClick={() => {
                  if (user) {
                    setTab('review');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
              >
                Add Review
              </Button>
            </li>
            <li>
              <Button
                disabled={postProgress.isActive || hasRequested}
                onClick={() => {
                  if (user) {
                    setTab('request');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
              >
                Add Request
              </Button>
            </li>
          </ul>
        </nav>
      </header>

      {isLoginModalOpen && (
        <LoginRequiredModal
          onClose={() => {
            setIsLoginModalOpen(false);
          }}
        />
      )}

      <div className="shell-content__body">
        {tab === 'read' ? (
          <ShellContentRead preprint={preprint} actions={actions} />
        ) : tab === 'request' ? (
          <ShellContentRequest
            user={user}
            preprint={preprint}
            onSubmit={action => {
              post(action, () => {
                setTab('read');
              });
            }}
            disabled={postProgress.isActive}
            error={
              postProgress.body &&
              postProgress.body['@type'] === 'RequestForRapidPREreviewAction' &&
              postProgress.error
            }
          />
        ) : (
          <ShellContentReview
            user={user}
            preprint={preprint}
            onSubmit={action => {
              post(action, () => {
                setTab('read');
              });
            }}
            disabled={postProgress.isActive}
            error={
              postProgress.body &&
              postProgress.body['@type'] === 'RapidPREreviewAction' &&
              postProgress.error
            }
          />
        )}
      </div>
    </div>
  );
}

ShellContent.propTypes = {
  preprint: PropTypes.object.isRequired,
  defaultTab: PropTypes.oneOf(['read', 'review', 'request'])
};

function ShellContentRead({ preprint, actions }) {
  return (
    <div>
      <Barplot stats={getYesNoStats(actions)} />
      <TextAnswers answers={getTextAnswers(actions)} />
    </div>
  );
}
ShellContentRead.propTypes = {
  preprint: PropTypes.object.isRequired,
  actions: PropTypes.array.isRequired
};

function ShellContentReview({ user, preprint, onSubmit, disabled, error }) {
  const [answerMap, setAnswerMap] = useState({}); // TODO read from local storage ?

  const canSubmit = checkIfAllAnswered(answerMap);

  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault();
        }}
      >
        <RapidFormFragment
          answerMap={answerMap}
          onChange={(key, value) => {
            setAnswerMap(prev => {
              return Object.assign({}, prev, { [key]: value });
            });
          }}
        />

        <Controls error={error}>
          <Button
            type="submit"
            disabled={disabled || !canSubmit}
            onClick={() => {
              onSubmit({
                '@type': 'RapidPREreviewAction',
                actionStatus: 'CompletedActionStatus',
                agent: getId(getDefaultRole(user)),
                object: createPreprintIdentifierCurie(preprint),
                resultReview: {
                  '@type': 'RapidPREreview',
                  reviewAnswer: getReviewAnswers(answerMap)
                }
              });
            }}
          >
            Submit
          </Button>
        </Controls>
      </form>
    </div>
  );
}
ShellContentReview.propTypes = {
  user: PropTypes.object,
  preprint: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.instanceOf(Error)
};

function ShellContentRequest({ user, preprint, onSubmit, disabled, error }) {
  return (
    <div>
      Request
      <Controls error={error}>
        <Button
          disabled={disabled}
          onClick={() => {
            onSubmit({
              '@type': 'RequestForRapidPREreviewAction',
              actionStatus: 'CompletedActionStatus',
              agent: getId(getDefaultRole(user)),
              object: createPreprintIdentifierCurie(preprint)
            });
          }}
        >
          Submit
        </Button>
      </Controls>
    </div>
  );
}
ShellContentRequest.propTypes = {
  user: PropTypes.object,
  preprint: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.instanceOf(Error)
};

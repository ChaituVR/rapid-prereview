import React, { Fragment, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import { format, formatDistanceStrict } from 'date-fns';
import {
  MdTimeline,
  MdCode,
  MdChevronRight,
  MdExpandLess,
  MdExpandMore
} from 'react-icons/md';
import Tooltip from '@reach/tooltip';
import Value from './value';
import { getTags } from '../utils/stats';
import { checkIfHasReviewed, checkIfHasRequested } from '../utils/actions';
import ScoreBadge from './score-badge';
import IconButton from './icon-button';
import TagPill from './tag-pill';
import AddPrereviewIcon from '../svgs/add_prereview_icon.svg';
import Collapse from './collapse';
import ReviewReader from './review-reader';
import XLink from './xlink';
import Button from './button';
import { useAnimatedScore } from '../hooks/score-hooks';

export default function PreprintCard({
  user,
  preprint,
  onNewRequest,
  onNewReview,
  onNew
}) {
  const [isOpened, setIsOpened] = useState(false);

  const { name, preprintServer, doi, arXivId, datePosted } = preprint;

  const reviews = useMemo(() => {
    return preprint.potentialAction.filter(
      action => action['@type'] === 'RapidPREreviewAction'
    );
  }, [preprint]);

  const requests = useMemo(() => {
    return preprint.potentialAction.filter(
      action => action['@type'] === 'RequestForRapidPREreviewAction'
    );
  }, [preprint]);

  const hasReviewed = checkIfHasReviewed(user, reviews);
  const hasRequested = checkIfHasRequested(user, requests);

  const { hasData, hasCode, subjects } = getTags(preprint.potentialAction);

  const {
    nRequests,
    nReviews,
    now,
    onStartAnim,
    onStopAnim,
    dateFirstActivity
  } = useAnimatedScore(preprint.potentialAction);

  return (
    <Fragment>
      <div className="preprint-card">
        <div className="preprint-card__contents">
          <div className="preprint-card__header">
            <XLink
              href={`/${doi || arXivId}`}
              to={{
                pathname: `/${doi || arXivId}`,
                state: {
                  preprint: omit(preprint, ['potentialAction']),
                  tab: 'read'
                }
              }}
              className="preprint-card__title"
            >
              <Value tagName="h2" className="preprint-card__title-text">
                {name}
              </Value>
            </XLink>

            <span className="preprint-card__pub-date">
              {format(new Date(datePosted), 'MMM. d, yyyy')}
            </span>
          </div>
          <div className="preprint-card__info-row">
            <div className="preprint-card__info-row__left">
              <Value tagName="span" className="preprint-card__server-name">
                {preprintServer.name}
              </Value>
              <MdChevronRight className="preprint-card__server-arrow-icon" />
              <Value tagName="span" className="preprint-card__server-id">
                {doi ? (
                  <a
                    href={`https://doi.org/${doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {doi}
                  </a>
                ) : (
                  <a
                    href={`https://arxiv.org/abs/${arXivId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {arXivId}
                  </a>
                )}
              </Value>
            </div>

            <div className="preprint-card__info-row__right">
              <ul className="preprint-card__tag-list">
                {subjects.map(subject => (
                  <li key={subject} className="preprint-card__tag-list__item">
                    <Tooltip
                      label={`Majority of reviewers tagged with ${subject}`}
                    >
                      <div>
                        <TagPill>{subject}</TagPill>
                      </div>
                    </Tooltip>
                  </li>
                ))}
                <li className="preprint-card__tag-list__item">
                  <Tooltip
                    label={
                      hasData
                        ? 'Majority of reviewers reported data'
                        : 'Majority of reviewers did not report data'
                    }
                  >
                    <div
                      className={`preprint-card__tag-icon ${
                        hasData
                          ? 'preprint-card__tag-icon--active'
                          : 'preprint-card__tag-icon--inactive'
                      }`}
                    >
                      <MdTimeline className="preprint-card__tag-icon__icon" />
                    </div>
                  </Tooltip>
                </li>
                <li className="preprint-card__tag-list__item">
                  <Tooltip
                    label={
                      hasCode
                        ? 'Majority of reviewers reported code'
                        : 'Majority of reviewers did not report code'
                    }
                  >
                    <div
                      className={`preprint-card__tag-icon ${
                        hasCode
                          ? 'preprint-card__tag-icon--active'
                          : 'preprint-card__tag-icon--inactive'
                      }`}
                    >
                      <MdCode className="preprint-card__tag-icon__icon" />
                    </div>
                  </Tooltip>
                </li>
              </ul>
            </div>
          </div>

          <div className="preprint-card__expansion-header">
            <div className="preprint-card__expansion-header__left">
              {/*<Tooltip label="Number of reviews and requests for reviews for this preprint">*/}
              {/* ScoreBadge uses forwardRef but Tooltip doesn't work without extra div :( */}
              <div className="preprint-card__score-badge-container">
                <ScoreBadge
                  now={now}
                  nRequests={nRequests}
                  nReviews={nReviews}
                  dateFirstActivity={dateFirstActivity}
                  onMouseEnter={onStartAnim}
                  onMouseLeave={onStopAnim}
                />
              </div>
              {/*</Tooltip>*/}
              <button
                className="preprint-card__cta-button"
                disabled={hasReviewed && hasRequested}
                onClick={() => {
                  if (!hasReviewed && !hasRequested) {
                    onNew(preprint);
                  } else if (!hasReviewed && hasRequested) {
                    onNewReview(preprint);
                  } else if (hasReviewed && !hasRequested) {
                    onNewRequest(preprint);
                  }
                }}
              >
                <div className="preprint-card__cta-button__contents">
                  <div className="preprint-card__cta-button__icon-container">
                    <AddPrereviewIcon className="preprint-card__cta-button__icon" />
                  </div>
                  <div className="preprint-card__count-badge">{nReviews}</div>
                  <div className="preprint-card__count-label">
                    Review{nReviews > 1 ? 's' : ''}
                  </div>
                  <div className="preprint-card__count-divider"></div>
                  <div className="preprint-card__count-badge">{nRequests}</div>
                  <div className="preprint-card__count-label">
                    Request{nRequests > 1 ? 's' : ''}
                  </div>
                </div>
              </button>
              {/* <div className="preprint-card__count-badge">{reviews.length}</div>
                  <div className="preprint-card__count-label">
                  Review{reviews.length > 1 ? 's' : ''}
                  </div>
                  <div className="preprint-card__count-plus">+</div>
                  <div className="preprint-card__count-badge">
                  {requests.length}
                  </div>
                  <div className="preprint-card__count-label">
                  Request{requests.length > 1 ? 's' : ''}
                  </div>

                  <Tooltip
                  label={
                  hasReviewed && hasRequested
                  ? 'You already reviewed and requested reviews for this preprint'
                  : !hasReviewed && hasRequested
                  ? 'Add your review'
                  : hasReviewed && !hasRequested
                  ? 'Add your request for review'
                  : 'Add your review or request for review'
                  }
                  >
                  <div className="preprint-card__add-button-container">
                  <IconButton
                  className="preprint-card__add-button"
                  disabled={hasReviewed && hasRequested}
                  onClick={() => {
                  if (!hasReviewed && !hasRequested) {
                  onNew(preprint);
                  } else if (!hasReviewed && hasRequested) {
                  onNewReview(preprint);
                  } else if (hasReviewed && !hasRequested) {
                  onNewRequest(preprint);
                  }
                  }}
                  >
                  <AddPrereviewIcon />
                  </IconButton>
                  </div>
                  </Tooltip> */}
            </div>
            <div className="preprint-card__expansion-header__right">
              <span className="preprint-card__days-ago">
                Started{' '}
                {formatDistanceStrict(new Date(dateFirstActivity), new Date())}{' '}
                ago
              </span>
              <IconButton
                className="preprint-card__expansion-toggle"
                onClick={e => {
                  setIsOpened(!isOpened);
                }}
              >
                {isOpened ? (
                  <MdExpandLess className="preprint-card__expansion-toggle-icon" />
                ) : (
                  <MdExpandMore className="preprint-card__expansion-toggle-icon" />
                )}
              </IconButton>
            </div>
          </div>
        </div>
      </div>
      <Collapse isOpened={isOpened} className="preprint-card__collapse">
        <div className="preprint-card-expansion">
          <ReviewReader
            identifier={preprint.doi || preprint.arXivId}
            actions={reviews}
            preview={true}
          />

          <div className="preprint-card__view-more">
            <div>
              {!hasReviewed && (
                <Button
                  onClick={() => {
                    onNewReview(preprint);
                  }}
                >
                  Add Review
                </Button>
              )}

              {!hasRequested && (
                <Button
                  onClick={() => {
                    onNewRequest(preprint);
                  }}
                >
                  Request Review
                </Button>
              )}

              <Button
                element="XLink"
                to={`/${preprint.doi || preprint.arXivId}`}
                href={`/${preprint.doi || preprint.arXivId}`}
              >
                View More
              </Button>
            </div>
          </div>
        </div>
      </Collapse>
    </Fragment>
  );
}

PreprintCard.propTypes = {
  user: PropTypes.object,
  preprint: PropTypes.shape({
    doi: PropTypes.string,
    arXivId: PropTypes.string,
    datePosted: PropTypes.string,
    name: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        '@type': PropTypes.string.isRequired,
        '@value': PropTypes.string.isRequired
      }).isRequired
    ]).isRequired,
    preprintServer: PropTypes.shape({
      name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          '@type': PropTypes.string.isRequired,
          '@value': PropTypes.string.isRequired
        }).isRequired
      ]).isRequired
    }).isRequired,
    potentialAction: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          '@type': PropTypes.oneOf(['RequestForRapidPREreviewAction'])
        }),
        PropTypes.shape({
          '@type': PropTypes.oneOf(['RapidPREreviewAction'])
        })
      ])
    ).isRequired
  }).isRequired,
  onNewRequest: PropTypes.func.isRequired,
  onNewReview: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired
};

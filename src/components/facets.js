import React from 'react';
import PropTypes from 'prop-types';

export default function Facets({ counts }) {
  return (
    <div className="facets">
      <section>
        <header>Contents</header>
        <ul>
          {!!counts.hasReviews && (
            <li>
              <input type="checkbox" id="counts-reviews" name="hasReviews" />
              <label htmlFor="counts-reviews">
                With Reviews <span>{counts.hasReviews.true || 0}</span>
              </label>
            </li>
          )}

          {!!counts.hasReviews && (
            <li>
              <input
                type="checkbox"
                id="counts-reviews-false"
                name="hasNoReview"
              />
              <label htmlFor="counts-reviews-false">
                Without Reviews <span>{counts.hasReviews.false || 0}</span>
              </label>
            </li>
          )}

          {!!counts.hasRequests && (
            <li>
              <input type="checkbox" id="counts-requests" name="hasRequests" />
              <label htmlFor="counts-requests">
                With Requests <span>{counts.hasRequests.true || 0}</span>
              </label>
            </li>
          )}

          {!!counts.hasRequests && (
            <li>
              <input
                type="checkbox"
                id="counts-requests-false"
                name="hasNoRequest"
              />
              <label htmlFor="counts-requests-fasle">
                Without Requests <span>{counts.hasRequests.false || 0}</span>
              </label>
            </li>
          )}

          {!!counts.hasData && (
            <li>
              <input type="checkbox" id="counts-data" name="hasData" />
              <label htmlFor="counts-data">
                With Reported Data <span>{counts.hasData.true || 0}</span>
              </label>
            </li>
          )}

          {!!counts.hasCode && (
            <li>
              <input type="checkbox" id="counts-code" name="hasCode" />
              <label htmlFor="counts-code">
                With Reported Code <span>{counts.hasCode.true}</span>
              </label>
            </li>
          )}
        </ul>
      </section>

      {!!(counts.subjectName && Object.keys(counts.subjectName).length > 0) && (
        <section>
          <header>Diseases</header>
          <ul>
            {Object.keys(counts.subjectName).map(subject => (
              <li key={subject}>
                <input
                  type="checkbox"
                  id={`counts-${subject}`}
                  name={subject}
                />
                <label htmlFor={`counts-${subject}`}>
                  {subject} <span>{counts.subjectName[subject]}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

Facets.propTypes = {
  counts: PropTypes.shape({
    hasReviews: PropTypes.shape({
      true: PropTypes.number,
      false: PropTypes.number
    }),
    hasRequests: PropTypes.shape({
      true: PropTypes.number,
      false: PropTypes.number
    }),
    hasData: PropTypes.shape({
      true: PropTypes.number,
      false: PropTypes.number
    }),
    hasCode: PropTypes.shape({
      true: PropTypes.number,
      false: PropTypes.number
    }),
    subjectName: PropTypes.object
  }).isRequired
};

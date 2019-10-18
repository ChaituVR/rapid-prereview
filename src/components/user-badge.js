import React from 'react';
import PropTypes from 'prop-types';
import { getDefaultRole } from '../utils/users';
import { RoleBadgeUI } from './role-badge';

export default function UserBadge({ user, children }) {
  const role = getDefaultRole(user);

  return <RoleBadgeUI role={role}>{children}</RoleBadgeUI>;
}

UserBadge.propTypes = {
  user: PropTypes.shape({
    '@id': PropTypes.string.isRequired,
    '@type': PropTypes.oneOf([
      'Person',
      'PublicReviewerRole',
      'AnonymousReviewerRole'
    ]).isRequired,
    name: PropTypes.string,
    orcid: PropTypes.string.isRequired,
    hasRole: PropTypes.arrayOf(
      PropTypes.shape({
        '@id': PropTypes.string.isRequired,
        '@type': PropTypes.oneOf([
          'PublicReviewerRole',
          'AnonymousReviewerRole'
        ]).isRequired,
        name: PropTypes.string,
        avatar: PropTypes.shape({
          '@type': PropTypes.oneOf(['ImageObject']).isRequired,
          encodingFormat: PropTypes.oneOf(['image/jpeg', 'image/png'])
            .isRequired,
          contentUrl: PropTypes.string.isRequired
        })
      })
    )
  }).isRequired,
  children: PropTypes.any
};

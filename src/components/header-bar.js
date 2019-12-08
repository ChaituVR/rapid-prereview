import React from 'react';
import PropTypes from 'prop-types';
import { MdMenu } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { MenuLink } from '@reach/menu-button';
import RapidPreReviewLogo from './rapid-pre-review-logo';
import IconButton from './icon-button';
import { useUser } from '../contexts/user-context';
import { useRole } from '../hooks/api-hooks';
import UserBadge from './user-badge';
import XLink from './xlink';

export default function HeaderBar({ onClickMenuButton }) {
  const [user] = useUser();
  const [role] = useRole(user && user.defaultRole);

  return (
    <div className="header-bar">
      <div className="header-bar__left">
        {!!onClickMenuButton && (
          <IconButton
            data-noclickoutside="true"
            onClickCapture={onClickMenuButton}
            className="header-bar__menu-button"
          >
            <MdMenu
              className="header-bar__menu-button-icon"
              data-noclickoutside="true"
            />
          </IconButton>
        )}
        <RapidPreReviewLogo />
      </div>

      <div className="header-bar__right">
        <Link className="header-bar__nav-item" to="/code-of-conduct">
          Code of Conduct
        </Link>
        <Link className="header-bar__nav-item" to="/app">
          App
        </Link>
        <Link className="header-bar__nav-item" to="/api">
          API
        </Link>
        <span className="header-bar__nav-item header-bar__nav-item--user-badge">
          {user ? (
            <UserBadge user={user}>
              <MenuLink
                as={process.env.IS_EXTENSION ? undefined : Link}
                to={process.env.IS_EXTENSION ? undefined : '/settings'}
                href={
                  process.env.IS_EXTENSION
                    ? `${process.env.API_URL}/settings`
                    : undefined
                }
                target={process.env.IS_EXTENSION ? '_blank' : undefined}
              >
                Profile Settings
              </MenuLink>

              {user.isAdmin && (
                <MenuLink
                  as={process.env.IS_EXTENSION ? undefined : Link}
                  to={process.env.IS_EXTENSION ? undefined : '/admin'}
                  href={
                    process.env.IS_EXTENSION
                      ? `${process.env.API_URL}/admin`
                      : undefined
                  }
                  target={process.env.IS_EXTENSION ? '_blank' : undefined}
                >
                  Admin Settings
                </MenuLink>
              )}

              {user.isAdmin && (
                <MenuLink
                  as={process.env.IS_EXTENSION ? undefined : Link}
                  to={process.env.IS_EXTENSION ? undefined : '/block'}
                  href={
                    process.env.IS_EXTENSION
                      ? `${process.env.API_URL}/block`
                      : undefined
                  }
                  target={process.env.IS_EXTENSION ? '_blank' : undefined}
                >
                  Moderate Users
                </MenuLink>
              )}

              {!!(role && role.isModerator && !role.isModerated) && (
                <MenuLink
                  as={process.env.IS_EXTENSION ? undefined : Link}
                  to={process.env.IS_EXTENSION ? undefined : '/moderate'}
                  href={
                    process.env.IS_EXTENSION
                      ? `${process.env.API_URL}/moderate`
                      : undefined
                  }
                  target={process.env.IS_EXTENSION ? '_blank' : undefined}
                >
                  Moderate Reviews
                </MenuLink>
              )}
              <MenuLink href={`${process.env.API_URL}/auth/logout`}>
                Logout
              </MenuLink>
            </UserBadge>
          ) : (
            <XLink to="/login" href="/login">
              Login
            </XLink>
          )}
        </span>
      </div>
      {/* TODO link to feedback form */}
      <div className="header-bar__give-feedback">
        <a
          href="https://docs.google.com/forms/d/1ao2f12U96lKlbVJifrWHEhPmCAB3ZHD16s-I7WmJyU4/viewform?edit_requested=true"
          target="_blank"
          rel="noopener noreferrer"
        >
          Give Feedback
        </a>
      </div>
    </div>
  );
}

HeaderBar.propTypes = {
  onClickMenuButton: PropTypes.func
};

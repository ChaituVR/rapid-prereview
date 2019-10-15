import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { MdErrorOutline } from 'react-icons/md';
import Modal from './modal';

export default function LoginRequiredModal({ onClose }) {
  return (
    <Modal
      className="login-required-modal"
      showCloseButton={true}
      onClose={onClose}
      title={
        <Fragment>
          <MdErrorOutline className="login-required-modal__title-icon" />
          Log in required
        </Fragment>
      }
    >
      <p>You need to be logged in to perform this action</p>

      <p>
        <Link to="/login">Log in with your ORCID</Link>
      </p>
    </Modal>
  );
}

LoginRequiredModal.propTypes = {
  onClose: PropTypes.func.isRequired
};

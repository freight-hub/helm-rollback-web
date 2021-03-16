import React from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

export default function UserIdentity(props) {
  const { userData } = props;

  if (!userData?.email) {
    return null;
  } else {
    return (
      <Typography variant="h6" component="p" gutterBottom>
        Logged in as {userData.email}
      </Typography>
    );
  }
}
UserIdentity.propTypes = {
  userData: PropTypes.shape({
    email: PropTypes.string,
  }).isRequired,
};

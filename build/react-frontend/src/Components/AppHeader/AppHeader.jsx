import React from 'react';
import { Avatar, Container, Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import logo from './../../forto_30.png';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    marginRight: '1em',
  },
  title: {
    flex: '1',
  },
  userInfo: {
    margin: '0 1em',
  },
});

export default function AppHeader(props) {
  const { email, isMock } = props?.userData ?? {};
  const [handle, domain] = email?.split('@') ?? [];

  const classes = useStyles();

  const doLogout = () => {
    // works because the cookie isn't HttpOnly (as of writing)
    document.cookie = "session-name= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
    document.location.reload();
  };

  return (
    <Container className={classes.container}>

      <Avatar className={classes.logo} src={logo} alt="logo" />

      <Typography className={classes.title} variant="h4" component="h1">
        Helm Rollback Tool
      </Typography>

      {email ? (<>
        <Typography className={classes.userInfo} variant="p" component="p">
          <strong>{handle}</strong>@{domain}
        </Typography>

        <Button variant="contained" color="secondary" onClick={doLogout}
            disabled={isMock}
          >Log out</Button>
      </>) : null}

    </Container>
  );
}
AppHeader.propTypes = {
  userData: PropTypes.shape({
    email: PropTypes.string,
    isMock: PropTypes.bool,
  }).isRequired,
};

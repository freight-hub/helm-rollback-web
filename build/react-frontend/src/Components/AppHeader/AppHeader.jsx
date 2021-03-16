import React from 'react';
import { Avatar, Paper, Button, Typography } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import logo from './../../forto_150.png';

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    marginRight: theme.spacing(1.5),
  },
  title: {
    flex: '1',
  },
  userInfo: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
}));

export default function AppHeader(props) {
  const { email, isMock } = props?.userData ?? {};
  const [handle, domain] = email?.split('@') ?? [];

  const theme = useTheme();
  const classes = useStyles(theme);

  const doLogout = () => {
    // works because the cookie isn't HttpOnly (as of writing)
    document.cookie = "session-name= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
    document.location.reload();
  };

  return (
    <Paper className={classes.paper}>

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

    </Paper>
  );
}
AppHeader.propTypes = {
  userData: PropTypes.shape({
    email: PropTypes.string,
    isMock: PropTypes.bool,
  }).isRequired,
};

import React from 'react';
import { Container, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import GoogleButton from 'react-google-button';

const useStyles = makeStyles({
  container: {
    margin: '5em 0 2em',
    textAlign: 'center',
  },
  loginButton: {
    margin: '1em 0',
    display: 'inline-block',
  }
});

export default function LoginSplash() {

  const classes = useStyles();

  return (
    <Container className={classes.container}>

      <Typography variant="h5" component="h2" gutterBottom>
        Tool to rollback releases that are installed, to be used by engineers and product managers alike.
      </Typography>

      <Typography variant="h6" component="p" gutterBottom>
        To view releases, please log in:
      </Typography>

      <div className={classes.loginButton}>
        <GoogleButton
            onClick={() => { window.location.href = '/login' }}
          />
      </div>

    </Container>
  );
}

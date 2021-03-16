import React from 'react';
import { Container, Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import GoogleButton from 'react-google-button';

const useStyles = makeStyles({
  container: {
    maxWidth: '50em',
    margin: '5em auto 2em',
    padding: '2em',
    textAlign: 'center',
  },
  loginBox: {
    margin: '5em',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
});

export default function LoginSplash() {

  const classes = useStyles();

  return (
    <Paper className={classes.container}>

      <Typography variant="h5" component="h2" gutterBottom>
        Tool to rollback releases that are installed, to be used by engineers and product managers alike.
      </Typography>

      <div className={classes.loginBox}>
        <Typography variant="h6" component="p" gutterBottom>
          To view releases:
        </Typography>

        <GoogleButton
            onClick={() => { window.location.href = '/login' }}
          />
      </div>

    </Paper>
  );
}

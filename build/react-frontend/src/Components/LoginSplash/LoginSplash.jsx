import React from 'react';
import { Container, Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  container: {
    textAlign: 'center',
  },
  loginButton: {
    // backgroundColor: 'cornflowerblue',
  },
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

      <Button className={classes.loginButton}
          variant="contained"
          color="primary"
          href="/login"
          size="large"
        >
        Log in with Google
      </Button>

    </Container>
  );
}

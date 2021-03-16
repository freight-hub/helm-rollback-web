import React from 'react';
import { Container, Button, Typography } from '@material-ui/core';

export default function LoginSplash() {
  return (
    <Container>

      <Typography variant="h5" component="h2" gutterBottom>
        Tool to rollback releases that are installed, to be used by engineers and product managers alike.
      </Typography>

      <Typography variant="h6" component="p" gutterBottom>
        To view releases, please log in:
      </Typography>

      <Button className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary LoginButton" variant="contained" color="primary" href="/login">
        Log in with Google
      </Button>

    </Container>
  );
}

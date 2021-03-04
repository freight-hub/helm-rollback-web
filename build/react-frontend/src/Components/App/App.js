import React from 'react';
import logo from './../../forto_150.png';
import './App.css';
import Typography from '@material-ui/core/Typography';
import { Button, Paper, Container, AppBar, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';

function App() {
  const client_id = "sau3e70wvs369jw1u25ex8g3cve599"
  const redirect_uri = "https://" + encodeURI(window.location.href.split("/")[2]) + "/twitchadmin"
  const googleURL = "https://id.twitch.tv/oauth2/authorize?client_id="+ client_id +"&redirect_uri="+ redirect_uri +"&response_type=code&scope=user:read:broadcast"

  return (
    <Container className="App">
      <Paper>
        <img src={logo} className="App-logo" alt="logo" />
        <Typography variant="h4" component="h1" gutterBottom>
          Helm Rollback Tool
        </Typography>
        <Button variant="contained" color="primary" href={googleURL}>
          Log in with Google
        </Button>
        <Typography variant="h5" component="h2" gutterBottom>
          Tool to rollback releases that are installed, to be used by engineers and product managers alike
        </Typography>
      </Paper>
    </Container>
  );
}

export default App;

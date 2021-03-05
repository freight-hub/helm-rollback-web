import React from 'react';
import logo from './../../forto_30.png';
import './App.css';
import Typography from '@material-ui/core/Typography';
import { Paper, Container, AppBar, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';
import LoginOrWho from '../LoginOrWho/LoginOrWho';
import LoginOrReleases from '../LoginOrReleases/LoginOrReleases';
import ReleaseDetails from '../ReleaseDetails/ReleaseDetails';
import RollBackDetails from '../RollBackDetails/RollBackDetails';

function Page() {
  if (window.location.href.split("/")[3] === "release") {
    return <ReleaseDetails></ReleaseDetails>
  } else if (window.location.href.split("/")[3] === "rollback") {
    return <RollBackDetails></RollBackDetails>
  } else {
    return <LoginOrReleases></LoginOrReleases>
  }
}

function App() {
  return (
    <Container className="App">
      <Paper>
        
      <AppBar position="static" className="Header">        
      <TableContainer component={Container}>
          <Table><TableBody>
            <TableRow className="HeaderRow">
              <TableCell className="HeaderCell"><img src={logo} className="Forto-logo" alt="logo" /></TableCell>
              <TableCell className="HeaderCell">Helm Rollback Tool</TableCell>
              <TableCell className="LoginCell"><LoginOrWho /></TableCell>
            </TableRow>
          </TableBody></Table>
        </TableContainer>
      </AppBar>
        <Typography variant="h4" component="h1" gutterBottom>
          Helm Rollback Tool
        </Typography>
        <Page></Page>
      </Paper>
    </Container>
  );
}

export default App;

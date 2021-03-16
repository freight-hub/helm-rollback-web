import React, { useEffect, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import { Paper, Container, AppBar, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';
import { useRoutes } from 'hookrouter';

import logo from './../../forto_30.png';
import './App.css';
import LoginSplash from '../LoginSplash/LoginSplash.jsx';
import UserIdentity from '../UserIdentity/UserIdentity.jsx';
import ReleaseList from '../ReleaseList/ReleaseList.jsx';
import ReleaseDetails from '../ReleaseDetails/ReleaseDetails.jsx';
import RollBackDetails from '../RollBackDetails/RollBackDetails';
import { DefaultRollbackApi } from "../../lib/rollback-api";

const routes = {
  '/': () => <ReleaseList />,
  '/release/:namespace/:releaseName': args => <ReleaseDetails {...args} />,
  '/rollback/:namespace/:releaseName/:revision': args => <RollBackDetails {...args} />,
};

export default function App() {
  const routeResult = useRoutes(routes);

  const [userData, setUserData] = useState({});
  useEffect(() => {
    DefaultRollbackApi.getLoginStatus().then(setUserData);
  }, [setUserData]);

  const hasUser = typeof userData?.email === 'string';

  return (
    <Container className="App">
      <Paper>

        <AppBar position="static" className="Header">
          <TableContainer component={Container}>
            <Table><TableBody>
              <TableRow className="HeaderRow">
                <TableCell className="HeaderCell">
                  <img src={logo} className="Forto-logo" alt="logo" />
                  <Typography variant="h4" component="h1">
                    Helm Rollback Tool
                  </Typography>
                </TableCell>
                <TableCell className="LoginCell">
                  <UserIdentity userData={userData} />
                </TableCell>
              </TableRow>
            </TableBody></Table>
          </TableContainer>
        </AppBar>

        {hasUser ? routeResult : <LoginSplash />}
      </Paper>
    </Container>
  );
}

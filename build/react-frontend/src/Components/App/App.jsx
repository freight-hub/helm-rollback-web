import React, { useEffect, useState } from 'react';
import { Paper, Container, AppBar } from '@material-ui/core';
import { useRoutes } from 'hookrouter';

import LoginSplash from '../LoginSplash/LoginSplash.jsx';
import AppHeader from '../AppHeader/AppHeader.jsx';
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
          <AppHeader userData={userData} />
        </AppBar>

        {hasUser ? routeResult : <LoginSplash />}
      </Paper>
    </Container>
  );
}

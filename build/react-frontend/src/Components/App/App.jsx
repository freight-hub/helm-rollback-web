import React, { useEffect, useState } from 'react';
import { Paper, Container, AppBar } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { useRoutes } from 'hookrouter';

import LoginSplash from '../LoginSplash/LoginSplash.jsx';
import AppHeader from '../AppHeader/AppHeader.jsx';
import ReleaseList from '../ReleaseList/ReleaseList.jsx';
import ReleaseDetails from '../ReleaseDetails/ReleaseDetails.jsx';
import RollBackDetails from '../RollBackDetails/RollBackDetails.jsx';
import { DefaultRollbackApi } from "../../lib/rollback-api";
import TechEnabledOperationsIcon from "../Icons/TechEnabledOperationsIcon.jsx";

const routes = {
  '/': () => <ReleaseList />,
  '/release/:namespace/:releaseName': args => <ReleaseDetails {...args} />,
  '/rollback/:namespace/:releaseName/:revision': args => <RollBackDetails {...args} />,
};

const useStyles = makeStyles(theme => ({
  headPaper: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
  },
  footerIconWrap: {
    margin: '5em 1em',
    textAlign: 'center',
  },
  footerIcon: {
    fontSize: '15em',
    color: 'rgba(255, 255, 255, 0.4)',
  },
}));

export default function App() {
  const routeResult = useRoutes(routes);

  const theme = useTheme();
  const classes = useStyles(theme);

  const [userData, setUserData] = useState({});
  useEffect(() => {
    DefaultRollbackApi.getLoginStatus().then(setUserData);
  }, [setUserData]);

  const hasUser = typeof userData?.email === 'string';

  return (
    <Container className="App">

      <AppHeader userData={userData} />

      {hasUser ? routeResult : <LoginSplash />}

      <div className={classes.footerIconWrap}>
        <TechEnabledOperationsIcon className={classes.footerIcon} />
      </div>
    </Container>
  );
}

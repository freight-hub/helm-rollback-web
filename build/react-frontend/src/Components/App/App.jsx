import { Container } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { useRoutes, A } from 'hookrouter';
import React, { useEffect, useState } from 'react';

import { DefaultRollbackApi } from "../../lib/rollback-api";
import { getTheme } from '../../lib/theme';
import AppHeader from '../AppHeader/AppHeader.jsx';
import TechEnabledOperationsIcon from "../Icons/TechEnabledOperationsIcon.jsx";
import LoginSplash from '../LoginSplash/LoginSplash.jsx';
import ReleaseDetails from '../ReleaseDetails/ReleaseDetails.jsx';
import ReleaseList from '../ReleaseList/ReleaseList.jsx';
import RollBackDetails from '../RollBackDetails/RollBackDetails.jsx';
import TextPage from '../TextPage/TextPage.jsx';

const routes = {
  '/': () => <ReleaseList />,
  '/all-releases': () => <ReleaseList allReleases={true} />,
  '/namespace/:namespace': args => <ReleaseList {...args} />,
  '/release/:namespace/:releaseName': args => <ReleaseDetails {...args} />,
  '/rollback/:namespace/:releaseName/:revision': args => <RollBackDetails {...args} />,
};

const useStyles = makeStyles({
  footerIconWrap: {
    margin: '5em 1em',
    textAlign: 'center',
  },
  footerIcon: {
    fontSize: '15em',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default function App() {
  const routeResult = useRoutes(routes);
  const classes = useStyles();

  const [ userData, setUserData ] = useState({});
  useEffect(() => {
    DefaultRollbackApi.getLoginStatus().then(setUserData);
  }, [ setUserData ]);

  const hasUser = typeof userData?.email === 'string';

  const mainComponent = !hasUser
    ? <LoginSplash />
    : (routeResult || (
      <TextPage title="Page Not Found">
        Maybe you'd like to <A href="/">go to the homepage</A> and try again.
      </TextPage>
    ));

  return (
    <ThemeProvider theme={getTheme(userData.theme)} >
      <CssBaseline />
      <Container>
        <AppHeader userData={userData} />

        {mainComponent}

        <div className={classes.footerIconWrap}>
          <TechEnabledOperationsIcon className={classes.footerIcon} />
        </div>
      </Container>
    </ThemeProvider>
  );
}

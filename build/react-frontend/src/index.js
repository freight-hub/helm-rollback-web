import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './Components/App/App.jsx';
import * as serviceWorker from './serviceWorker';
import { redTheme, blueTheme } from './theme';

// TODO: ask the API what environment and theme to be using
const { hostname } = window.location;
const environment = hostname.endsWith('.forto.com') ? 'production' : 'sandbox';
const theme = environment === 'production' ? redTheme : blueTheme;

ReactDOM.render(
  <ThemeProvider theme={theme}>
    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
    <CssBaseline />
    <App environment={environment} />
  </ThemeProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

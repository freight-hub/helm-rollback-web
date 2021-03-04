import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import App from './Components/App/App';
//import AppAdmin from './Components/AppAdmin/AppAdmin';
import theme from './theme';
import * as serviceWorker from './serviceWorker';

function whichApp() {
  /*if (window.location.href.split("/")[3].search(/^admin/) >= 0) {
    return <AppAdmin />
  } else {
    */return <App />
  //}
}
const app = whichApp()
ReactDOM.render(
  <ThemeProvider theme={theme}>
    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
    <CssBaseline />
    {app}
  </ThemeProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

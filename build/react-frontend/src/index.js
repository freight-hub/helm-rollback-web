import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './Components/App/App.jsx';

ReactDOM.render(<App />, document.getElementById('root'));

// This app will never need to work offline
navigator.serviceWorker?.ready
  .then(x => x.unregister())
  .catch(error => console.error(error.message));

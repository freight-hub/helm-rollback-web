import './index.css';
import App from './Components/App/App.jsx';

import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// This app will never need to work offline
navigator.serviceWorker?.ready
  .then(x => x.unregister())
  .catch(error => console.error(error.message));

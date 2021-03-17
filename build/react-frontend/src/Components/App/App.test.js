import { render } from '@testing-library/react';
import React from 'react';

import App from './App.jsx';

test('renders login link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Sign in with Google/i);
  expect(linkElement).toBeInTheDocument();
});

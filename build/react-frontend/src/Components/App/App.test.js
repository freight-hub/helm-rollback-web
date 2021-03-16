import React from 'react';
import { render } from '@testing-library/react';
import App from './App.jsx';

test('renders login link', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Log in with Google/i);
  expect(linkElement).toBeInTheDocument();
});

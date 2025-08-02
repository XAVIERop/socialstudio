import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders main routes', () => {
  render(<App />);
  expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
});

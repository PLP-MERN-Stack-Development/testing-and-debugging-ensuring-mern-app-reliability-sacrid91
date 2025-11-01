// client/src/tests/unit/App.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock the fetch function
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<App />);
    
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fetch posts/i })).toBeInTheDocument();
  });

  it('displays loading state when fetching posts', async () => {
    // Mock fetch to resolve quickly
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    });

    render(<App />);
    
    const fetchButton = screen.getByRole('button', { name: /fetch posts/i });
    fireEvent.click(fetchButton);
    
    expect(fetchButton).toHaveTextContent('Loading...');
    expect(fetchButton).toBeDisabled();

    await waitFor(() => {
      expect(fetchButton).not.toBeDisabled();
      expect(fetchButton).toHaveTextContent('Fetch Posts');
    });
  });

  it('displays posts when fetch is successful', async () => {
    const mockPosts = [
      { _id: '1', title: 'Post 1', content: 'Content 1' },
      { _id: '2', title: 'Post 2', content: 'Content 2' },
    ];
    
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockPosts),
    });

    render(<App />);
    
    fireEvent.click(screen.getByRole('button', { name: /fetch posts/i }));

    await waitFor(() => {
      expect(screen.getByTestId('posts-container')).toBeInTheDocument();
    });

    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Post 2')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('handles fetch errors gracefully', async () => {
    console.error = jest.fn(); // Mock console.error to suppress error logs in tests
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);
    
    fireEvent.click(screen.getByRole('button', { name: /fetch posts/i }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching posts:', new Error('Network error'));
    });
  });
});
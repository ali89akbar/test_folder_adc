import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import App from '../../src/App.jsx';

vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return {
    default: {
      ...mockInstance,
      create: vi.fn(() => mockInstance),
    },
    ...mockInstance,
    create: vi.fn(() => mockInstance),
  };
});

describe('App Root Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checking session initially and displays login screen when unauthenticated', async () => {
    axios.get.mockRejectedValueOnce(new Error('Unauthorized'));

    render(<App />);

    expect(screen.getByText('Checking session…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Select Operational Site')).toBeInTheDocument();
    });
  });

  it('renders main application shell and sidebar when session is authenticated', async () => {
    const mockUser = { id: 1, username: 'admin', site: 'KHI', role: 'admin' };
    axios.get.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ data: { user: mockUser } });
      }
      return Promise.resolve({ data: [] });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Karachi')).toBeInTheDocument();
      expect(screen.getByText(/KHI — Active/i)).toBeInTheDocument();
      expect(screen.getByText('New Daily Entry')).toBeInTheDocument();
    });

    // Check sidebar navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('navigates between tabs when sidebar items are clicked', async () => {
    const mockUser = { id: 1, username: 'admin', site: 'KHI', role: 'admin' };
    axios.get.mockImplementation((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({ data: { user: mockUser } });
      }
      return Promise.resolve({ data: [] });
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('New Daily Entry')).toBeInTheDocument();
    });

    // Click on Dashboard tab in sidebar
    const dashboardTabBtn = screen.getByText('Dashboard');
    fireEvent.click(dashboardTabBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Stock Available/i).length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import Login from '../../../../src/components/layout/Login.jsx';

vi.mock('axios');

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const goToStep2 = async () => {
    const khiBtn = screen.getByText('Karachi');
    fireEvent.click(khiBtn);
    return await waitFor(() => screen.getByPlaceholderText('Enter your username'));
  };

  it('renders site selection initially (Step 1)', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByText('Select Operational Site')).toBeInTheDocument();
    expect(screen.getByText('Karachi')).toBeInTheDocument();
    expect(screen.getByText('Lahore')).toBeInTheDocument();
  });

  it('transitions to Step 2 and renders username and password fields', async () => {
    render(<Login onLogin={() => {}} />);
    await goToStep2();

    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    render(<Login onLogin={() => {}} />);
    await goToStep2();

    const passInput = screen.getByPlaceholderText('Enter your password');
    expect(passInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'password');
  });

  it('displays validation error if username or password is submitted empty', async () => {
    render(<Login onLogin={() => {}} />);
    await goToStep2();

    const submitBtn = screen.getByRole('button', { name: /Sign in/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please enter your username and password.')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('submits credentials, calls /api/auth/login, and triggers onLogin with user object on success', async () => {
    const mockOnLogin = vi.fn();
    const mockUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
    axios.post.mockResolvedValueOnce({ data: { success: true, user: mockUser } });

    render(<Login onLogin={mockOnLogin} />);
    await goToStep2();

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'Admin@12345' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'admin',
        password: 'Admin@12345',
      });
      expect(mockOnLogin).toHaveBeenCalledWith(mockUser);
    });
  });

  it('displays API error message when login fails', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials. Please try again.' } },
    });

    render(<Login onLogin={() => {}} />);
    await goToStep2();

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText('Invalid credentials. Please try again.')).toBeInTheDocument();
  });
});

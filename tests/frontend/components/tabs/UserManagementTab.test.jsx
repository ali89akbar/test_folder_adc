import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import UserManagementTab from '../../../../src/components/tabs/Usermaanagementtab.jsx';

vi.mock('axios');

describe('UserManagementTab Component', () => {
  const sampleUsers = [
    { id: 1, username: 'admin', site: 'KHI', role: 'admin', created_at: '2026-10-01', last_login: '2026-10-31' },
    { id: 2, username: 'operator1', site: 'LHE', role: 'user', created_at: '2026-10-05', last_login: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays user list on load', async () => {
    axios.get.mockResolvedValueOnce({ data: sampleUsers });

    render(<UserManagementTab toast={vi.fn()} />);

    expect(await screen.findByText('admin')).toBeInTheDocument();
    expect(screen.getByText('operator1')).toBeInTheDocument();
  });

  it('validates user creation input (missing fields / short password)', async () => {
    const mockToast = vi.fn();
    axios.get.mockResolvedValueOnce({ data: sampleUsers });

    render(<UserManagementTab toast={mockToast} />);

    // Click Add User without typing username or password
    const addBtn = screen.getByRole('button', { name: /Add User/i });
    fireEvent.click(addBtn);

    expect(mockToast).toHaveBeenCalledWith('Username, password, and site are required', 'error');
  });

  it('creates user successfully and refreshes list', async () => {
    const mockToast = vi.fn();
    axios.get
      .mockResolvedValueOnce({ data: sampleUsers }) // initial fetch
      .mockResolvedValueOnce({ data: [...sampleUsers, { id: 3, username: 'newuser', site: 'KHI', role: 'user' }] }); // refetch

    axios.post.mockResolvedValueOnce({ data: { success: true, userId: 3 } });

    render(<UserManagementTab toast={mockToast} />);

    await screen.findByText('admin');

    fireEvent.change(screen.getByPlaceholderText('e.g. dz.lahore'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'ValidPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/users', {
        username: 'newuser',
        password: 'ValidPass123!',
        site: 'KHI',
        role: 'user',
      });
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('created'), 'success');
    });
  });

  it('deletes user after confirmation', async () => {
    const mockToast = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    axios.get
      .mockResolvedValueOnce({ data: sampleUsers })
      .mockResolvedValueOnce({ data: [sampleUsers[0]] }); // after delete
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(<UserManagementTab toast={mockToast} />);

    await screen.findByText('operator1');

    const deleteButtons = screen.getAllByTitle(/Delete user/i);
    fireEvent.click(deleteButtons[1]); // Delete operator1

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/users/2');
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('deleted'), 'success');
    });
  });
});

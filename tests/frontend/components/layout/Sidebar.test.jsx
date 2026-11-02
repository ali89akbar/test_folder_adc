import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Sidebar from '../../../../src/components/layout/Sidebar.jsx';

describe('Sidebar Component', () => {
  const defaultProps = {
    site: 'KHI',
    tab: 'entry',
    setTab: vi.fn(),
    pendingTransit: 2,
    criticalCount: 1,
    forecast: [{ status: 'CRITICAL', cardType: 'Debit' }],
    orders: {},
    irisFiles: [],
    dailyRows: [],
    isAdmin: false,
    onSwitchSite: vi.fn(),
    onExport: vi.fn(),
    onSignOut: vi.fn(),
  };

  it('renders standard navigation tabs', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('New Entry')).toBeInTheDocument();
    expect(screen.getByText('Closing Balances')).toBeInTheDocument();
    expect(screen.getByText('Entry History')).toBeInTheDocument();
    expect(screen.getByText('Transit Tracking')).toBeInTheDocument();
    expect(screen.getByText('Forecasting')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('hides User Management tab for non-admin users', () => {
    render(<Sidebar {...defaultProps} isAdmin={false} />);
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });

  it('shows User Management tab when isAdmin is true', () => {
    render(<Sidebar {...defaultProps} isAdmin={true} />);
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('switches tab when a navigation item is clicked', () => {
    const setTab = vi.fn();
    render(<Sidebar {...defaultProps} setTab={setTab} />);

    fireEvent.click(screen.getByText('Transit Tracking'));
    expect(setTab).toHaveBeenCalledWith('transit');
  });

  it('displays pending transit and forecasting alert badges', () => {
    render(<Sidebar {...defaultProps} pendingTransit={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('triggers onSignOut callback when Logout is clicked', () => {
    const onSignOut = vi.fn();
    render(<Sidebar {...defaultProps} onSignOut={onSignOut} />);

    const logoutBtn = screen.getByText('Sign Out');
    fireEvent.click(logoutBtn);
    expect(onSignOut).toHaveBeenCalled();
  });
});

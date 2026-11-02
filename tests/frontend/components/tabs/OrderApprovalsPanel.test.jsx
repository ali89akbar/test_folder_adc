import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import OrderApprovalsPanel from '../../../../src/components/tabs/Orderapprovalspanel.jsx';

vi.mock('axios');

describe('OrderApprovalsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('polls pending count on mount and displays badge when count > 0', async () => {
    axios.get.mockResolvedValueOnce({ data: { count: 4 } });

    render(<OrderApprovalsPanel toast={vi.fn()} onOrdersChanged={vi.fn()} />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/orders/pending-count');
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('opens approvals panel and fetches pending list when bell is clicked', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { count: 1 } }) // count
      .mockResolvedValueOnce({
        data: [
          {
            key: 'ORD-TEST-1',
            invType: 'PLASTIC',
            subProduct: 'Visa Classic',
            scheme: 'VISA',
            site: 'KHI',
            qty: 500,
            requestedBy: 'operator1',
          },
        ],
      }); // pending list

    render(<OrderApprovalsPanel toast={vi.fn()} onOrdersChanged={vi.fn()} />);

    const bellBtn = await screen.findByTitle('Pending order approvals');
    fireEvent.click(bellBtn);

    expect(await screen.findByText('Visa Classic')).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('approves order when Approve button is clicked', async () => {
    const mockToast = vi.fn();
    const mockOnOrdersChanged = vi.fn();

    axios.get
      .mockResolvedValueOnce({ data: { count: 1 } })
      .mockResolvedValueOnce({
        data: [
          {
            key: 'ORD-TEST-1',
            invType: 'PLASTIC',
            subProduct: 'Visa Gold',
            scheme: 'VISA',
            site: 'KHI',
            qty: 300,
            requestedBy: 'operator1',
          },
        ],
      });

    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<OrderApprovalsPanel toast={mockToast} onOrdersChanged={mockOnOrdersChanged} />);

    // Open panel
    const bellBtn = await screen.findByTitle('Pending order approvals');
    fireEvent.click(bellBtn);

    // Click Approve
    const approveBtn = await screen.findByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/orders/ORD-TEST-1/approve'));
      expect(mockToast).toHaveBeenCalledWith('Order approved', 'success');
      expect(mockOnOrdersChanged).toHaveBeenCalled();
    });
  });
});

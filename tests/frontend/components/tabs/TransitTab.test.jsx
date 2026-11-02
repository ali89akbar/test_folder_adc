import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import TransitTab from '../../../../src/components/tabs/TransitTab.jsx';

vi.mock('axios');

describe('TransitTab Component', () => {
  const sampleRecords = [
    {
      id: 101,
      entryId: 1,
      fromSite: 'KHI',
      toSite: 'LHE',
      status: 'IN_TRANSIT',
      quantity: 500,
      cardType: 'DEBIT',
      scheme: 'VISA',
      plasticCategory: 'Standard',
      subProduct: 'Visa Classic',
      date: '2026-10-31',
      createdAt: '2026-10-31T10:00:00Z',
    },
    {
      id: 102,
      entryId: 2,
      fromSite: 'LHE',
      toSite: 'KHI',
      status: 'DELIVERED',
      quantity: 200,
      cardType: 'CREDIT',
      scheme: 'MASTERCARD',
      plasticCategory: 'Gold',
      subProduct: 'Mastercard Gold',
      date: '2026-10-30',
      createdAt: '2026-10-30T10:00:00Z',
      deliveredAt: '2026-10-30T15:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });
  });

  it('renders transit records and status counts', () => {
    render(
      <TransitTab
        currentSite="KHI"
        transitRecords={sampleRecords}
        setTransitRecords={vi.fn()}
        toast={vi.fn()}
        showAlert={vi.fn()}
        setClosing={vi.fn()}
        closing={{}}
        allEntries={[]}
        setAllEntries={vi.fn()}
      />
    );

    expect(screen.getByText('Transit Tracking')).toBeInTheDocument();
    expect(screen.getByText('Visa Classic')).toBeInTheDocument();
    expect(screen.getByText('Mastercard Gold')).toBeInTheDocument();
    expect(screen.getAllByText(/In Transit/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Delivered/i).length).toBeGreaterThan(0);
  });

  it('triggers confirmation modal when "Mark Delivered" is clicked', () => {
    const mockShowAlert = vi.fn();
    render(
      <TransitTab
        currentSite="LHE"
        transitRecords={sampleRecords}
        setTransitRecords={vi.fn()}
        toast={vi.fn()}
        showAlert={mockShowAlert}
        setClosing={vi.fn()}
        closing={{}}
        allEntries={[]}
        setAllEntries={vi.fn()}
      />
    );

    const markDeliveredBtn = screen.getByRole('button', { name: /Mark Delivered/i });
    fireEvent.click(markDeliveredBtn);

    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'transit',
        title: 'Confirm Delivery',
      })
    );
  });
});

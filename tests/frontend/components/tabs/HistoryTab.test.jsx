import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import HistoryTab from '../../../../src/components/tabs/HistoryTab.jsx';

describe('HistoryTab Component', () => {
  const sampleEntries = [
    {
      id: 1,
      date: '2026-10-31',
      site: 'KHI',
      invType: 'PLASTIC',
      cardType: 'DEBIT',
      scheme: 'VISA',
      plasticCategory: 'Standard',
      subProduct: 'Classic Debit',
      openingBalance: 1000,
      receivedFromVendor: 200,
      totalConsumption: 50,
      closingBalance: 1150,
    },
    {
      id: 2,
      date: '2026-10-30',
      site: 'LHE',
      invType: 'PLASTIC',
      cardType: 'DEBIT',
      scheme: 'PAYPAK',
      plasticCategory: 'Standard',
      subProduct: 'PayPak Classic',
      openingBalance: 500,
      receivedFromVendor: 0,
      totalConsumption: 100,
      closingBalance: 400,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleEntries,
      text: async () => '',
    });
  });

  it('renders history ledger table with search and filters', async () => {
    render(
      <HistoryTab
        allEntries={sampleEntries}
        setAllEntries={vi.fn()}
        toast={vi.fn()}
        currentSite="KHI"
      />
    );

    expect(screen.getByText('Entry History')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Classic Debit')).toBeInTheDocument();
      expect(screen.getByText('PayPak Classic')).toBeInTheDocument();
    });
  });

  it('filters table rows when search input changes', async () => {
    render(
      <HistoryTab
        allEntries={sampleEntries}
        setAllEntries={vi.fn()}
        toast={vi.fn()}
        currentSite="KHI"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Classic Debit')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search product, scheme/i);
    fireEvent.change(searchInput, { target: { value: 'Classic Debit' } });

    expect(screen.getByText('Classic Debit')).toBeInTheDocument();
    expect(screen.queryByText('PayPak Classic')).not.toBeInTheDocument();
  });
});

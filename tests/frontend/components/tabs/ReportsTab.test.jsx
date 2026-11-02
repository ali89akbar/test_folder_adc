import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReportsTab from '../../../../src/components/tabs/ReportsTab.jsx';

describe('ReportsTab Component', () => {
  const defaultProps = {
    entries: [
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
        batchCount: 50,
        totalConsumption: 50,
        closingBalance: 1150,
      },
    ],
    dailyRows: [],
    currentSite: 'KHI',
    closing: {
      'KHI|PLASTIC|DEBIT|VISA|Standard': { value: 1150 },
    },
  };

  it('renders Reports header and report type buttons', () => {
    render(<ReportsTab {...defaultProps} />);

    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText(/Select a report type to view/i)).toBeInTheDocument();
    expect(screen.getByText('💳 Issuance')).toBeInTheDocument();
    expect(screen.getByText('📅 Monthly')).toBeInTheDocument();
    expect(screen.getByText('🔍 Daily Audit')).toBeInTheDocument();
    expect(screen.getByText('📊 Range Report')).toBeInTheDocument();
  });

  it('switches active report view when clicked', () => {
    render(<ReportsTab {...defaultProps} />);

    const monthlyBtn = screen.getByText('📅 Monthly');
    fireEvent.click(monthlyBtn);

    expect(screen.getByText(/Please select a target month/i)).toBeInTheDocument();
    expect(screen.getByText('Reset Filters')).toBeInTheDocument();
  });
});

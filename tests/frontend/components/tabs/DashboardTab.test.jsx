import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DashboardTab from '../../../../src/components/tabs/DashboardTab.jsx';

describe('DashboardTab Component', () => {
  const sampleEntries = [
    {
      id: 1,
      date: '2026-10-31',
      site: 'KHI',
      invType: 'PLASTIC',
      cardType: 'Visa Classic',
      scheme: 'VISA',
      plasticCategory: 'Standard',
      subProduct: 'Debit EMV',
      segment: 'ETB',
      batchCount: 50,
      totalConsumption: 50,
    },
  ];

  const sampleClosing = {
    'KHI|PLASTIC|Visa Classic|VISA|Standard': { value: 1200 },
    'LHE|PLASTIC|Visa Classic|VISA|Standard': { value: 800 },
  };

  it('renders KPI summary cards and health breakdown', () => {
    render(
      <DashboardTab
        entries={sampleEntries}
        closing={sampleClosing}
        orders={{}}
        currentSite="KHI"
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText(/Stock Available/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('2,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Stock Health/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Stock by Site/i)).toBeInTheDocument();
  });
});

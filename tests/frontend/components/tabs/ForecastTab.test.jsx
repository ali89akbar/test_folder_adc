import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ForecastTab from '../../../../src/components/tabs/ForecastTab.jsx';

describe('ForecastTab Component', () => {
  it('renders empty state when no entries are provided', () => {
    render(
      <ForecastTab
        entries={[]}
        closing={{}}
        currentSite="KHI"
        orders={{}}
        setOrders={vi.fn()}
      />
    );

    expect(screen.getByText('Forecasting')).toBeInTheDocument();
    expect(screen.getByText('No Forecast Data Yet')).toBeInTheDocument();
  });

  it('renders forecast data and site filter buttons when entries are present', () => {
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
        segment: 'ETB',
        totalConsumption: 100,
      },
    ];

    const sampleClosing = {
      'KHI|PLASTIC|DEBIT|VISA|Standard': { value: 1000 },
      'LHE|PLASTIC|DEBIT|VISA|Standard': { value: 500 },
    };

    render(
      <ForecastTab
        entries={sampleEntries}
        closing={sampleClosing}
        currentSite="KHI"
        orders={{}}
        setOrders={vi.fn()}
      />
    );

    expect(screen.getByText('Forecasting')).toBeInTheDocument();
    expect(screen.getByText('Both Sites')).toBeInTheDocument();
    expect(screen.getByText('⬇ CSV')).toBeInTheDocument();
    expect(screen.getByText('⬇ PDF')).toBeInTheDocument();
  });
});

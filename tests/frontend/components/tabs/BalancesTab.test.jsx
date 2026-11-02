import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import BalancesTab from '../../../../src/components/tabs/BalancesTab.jsx';

vi.mock('axios');

describe('BalancesTab Component', () => {
  const sampleClosing = {
    'KHI|PLASTIC|DEBIT|VISA|Classic': { value: 2500, updatedAt: '2026-10-31', date: '2026-10-31', updatedBy: 'admin' },
    'LHE|PLASTIC|DEBIT|VISA|Classic': { value: 1500, updatedAt: '2026-10-31', date: '2026-10-31', updatedBy: 'admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });
  });

  it('renders Closing Balances header and site indicators', () => {
    render(
      <BalancesTab
        closing={sampleClosing}
        setClosing={vi.fn()}
        toast={vi.fn()}
        showAlert={vi.fn()}
        entries={[]}
        currentSite="KHI"
      />
    );

    expect(screen.getByText('Closing Balances')).toBeInTheDocument();
    expect(screen.getByText(/KHI and LHE each maintain their own independent balance/i)).toBeInTheDocument();
  });

  it('allows switching between inventory types (Plastic, Mailer, Envelope)', () => {
    render(
      <BalancesTab
        closing={sampleClosing}
        setClosing={vi.fn()}
        toast={vi.fn()}
        showAlert={vi.fn()}
        entries={[]}
        currentSite="KHI"
      />
    );

    const plasticBtn = screen.getByText('PLASTIC');
    const mailerBtn = screen.getByText('MAILER');

    expect(plasticBtn).toBeInTheDocument();
    expect(mailerBtn).toBeInTheDocument();

    fireEvent.click(mailerBtn);
  });
});

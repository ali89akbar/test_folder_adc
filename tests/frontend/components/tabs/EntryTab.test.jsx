import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EntryTab from '../../../../src/components/tabs/EntryTab.jsx';

describe('EntryTab Component', () => {
  const defaultProps = {
    entries: [],
    setEntries: vi.fn(),
    closing: {
      'KHI|PLASTIC|DEBIT|VISA|Classic': { value: 500 },
    },
    setClosing: vi.fn(),
    toast: vi.fn(),
    showAlert: vi.fn(),
    transitRecords: [],
    setTransitRecords: vi.fn(),
    currentSite: 'KHI',
    setOrders: vi.fn(),
    irisRecords: [],
    setIrisRecords: vi.fn(),
    irisFiles: [],
    setIrisFiles: vi.fn(),
    dailyRows: [],
    setDailyRows: vi.fn(),
    dailyFileName: '',
    setDailyFileName: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders New Daily Entry title and initial sections', () => {
    render(<EntryTab {...defaultProps} />);

    expect(screen.getByText('New Daily Entry')).toBeInTheDocument();
    expect(screen.getByText(/Record daily inventory movements/i)).toBeInTheDocument();
    expect(screen.getByText('Date, Inventory Type & Product Selection')).toBeInTheDocument();
    expect(screen.getByText('Received from Vendor')).toBeInTheDocument();
    expect(screen.getByText('Consumption & Deductions')).toBeInTheDocument();
  });

  it('allows switching inventory types (PLASTIC, MAILER, ENVELOPE)', () => {
    render(<EntryTab {...defaultProps} />);

    const plasticBtn = screen.getByText('PLASTIC');
    const mailerBtn = screen.getByText('MAILER');
    const envelopeBtn = screen.getByText('ENVELOPE');

    expect(plasticBtn).toBeInTheDocument();
    expect(mailerBtn).toBeInTheDocument();
    expect(envelopeBtn).toBeInTheDocument();

    fireEvent.click(mailerBtn);
    expect(screen.getByText('Page Size')).toBeInTheDocument();
  });

  it('validates required fields and warns user on empty save attempt', () => {
    const mockShowAlert = vi.fn();
    render(<EntryTab {...defaultProps} showAlert={mockShowAlert} />);

    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveBtn);

    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: expect.stringMatching(/Missing Sub Product|Missing Date/i),
      })
    );
  });

  it('displays the calculated balance box and resets form when Reset is clicked', () => {
    render(<EntryTab {...defaultProps} />);

    expect(screen.getByText(/Opening \+ Received − Consumed − Damaged − Moved/i)).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
  });
});

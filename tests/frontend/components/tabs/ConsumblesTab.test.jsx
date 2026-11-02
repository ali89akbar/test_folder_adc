import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import axios from 'axios';
import ConsumablesTab from '../../../../src/components/tabs/ConsumblesTab.jsx';

vi.mock('axios');

describe('ConsumablesTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });
  });

  it('renders Consumables Management header with site name and action buttons', () => {
    render(<ConsumablesTab entries={[]} siteId="KHI" />);

    expect(screen.getByText(/Consumables Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Track ribbon usage, remaining stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Shift Cycle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PDF/i })).toBeInTheDocument();
  });
});

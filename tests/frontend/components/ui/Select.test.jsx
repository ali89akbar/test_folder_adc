import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Select from '../../../../src/components/ui/Select.jsx';

describe('Select Component', () => {
  const options = ['Visa', 'Mastercard', 'PayPak', 'UnionPay'];

  it('renders with placeholder or default text', () => {
    render(<Select value="" options={options} placeholder="Choose Card Scheme" />);
    expect(screen.getByText('Choose Card Scheme')).toBeInTheDocument();
  });

  it('opens dropdown, displays options, filters options, and triggers onChange', () => {
    const handleChange = vi.fn();
    render(<Select value="" options={options} onChange={handleChange} />);

    // Click button to open
    const selectBtn = screen.getByRole('button');
    fireEvent.click(selectBtn);

    // Verify options are rendered
    expect(screen.getByText('Visa')).toBeInTheDocument();
    expect(screen.getByText('Mastercard')).toBeInTheDocument();

    // Type in search filter
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Pay' } });

    // 'Visa' should be filtered out, 'PayPak' should remain
    expect(screen.queryByText('Visa')).not.toBeInTheDocument();
    expect(screen.getByText('PayPak')).toBeInTheDocument();

    // Select PayPak (Select uses onMouseDown for option selection)
    fireEvent.mouseDown(screen.getByText('PayPak'));
    expect(handleChange).toHaveBeenCalledWith('PayPak');
  });

  it('does not open when disabled', () => {
    render(<Select value="" options={options} disabled={true} />);
    const selectBtn = screen.getByRole('button');
    fireEvent.click(selectBtn);
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
  });
});

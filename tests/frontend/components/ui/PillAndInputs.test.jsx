import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Pill, InvTypePill, SegPill, SitePill } from '../../../../src/components/ui/Pill.jsx';
import NumInput from '../../../../src/components/ui/NumInput.jsx';
import SegBtn from '../../../../src/components/ui/SegBtn.jsx';
import Toast from '../../../../src/components/ui/Toast.jsx';
import Field from '../../../../src/components/ui/Field.jsx';
import UBLLogo from '../../../../src/components/ui/UBLLogo.jsx';

describe('UI Supporting Components', () => {
  describe('Pills', () => {
    it('renders generic Pill with label', () => {
      render(<Pill label="Test Status" />);
      expect(screen.getByText('Test Status')).toBeInTheDocument();
    });

    it('renders InvTypePill for PLASTIC, MAILER, ENVELOPE', () => {
      const { rerender } = render(<InvTypePill type="PLASTIC" />);
      expect(screen.getByText(/PLASTIC/)).toBeInTheDocument();

      rerender(<InvTypePill type="MAILER" />);
      expect(screen.getByText(/MAILER/)).toBeInTheDocument();

      rerender(<InvTypePill type="ENVELOPE" />);
      expect(screen.getByText(/ENVELOPE/)).toBeInTheDocument();
    });

    it('renders SegPill for NTB, ETB, RENEWAL', () => {
      const { rerender } = render(<SegPill seg="NTB" />);
      expect(screen.getByText('NTB')).toBeInTheDocument();

      rerender(<SegPill seg="ETB" />);
      expect(screen.getByText('ETB')).toBeInTheDocument();
    });

    it('renders SitePill for KHI and LHE', () => {
      const { rerender } = render(<SitePill site="KHI" />);
      expect(screen.getByText(/KHI/)).toBeInTheDocument();

      rerender(<SitePill site="LHE" />);
      expect(screen.getByText(/LHE/)).toBeInTheDocument();
    });
  });

  describe('NumInput', () => {
    it('handles numeric input changes', () => {
      const handleChange = vi.fn();
      render(<NumInput val={50} onChange={handleChange} />);
      const input = screen.getByRole('spinbutton');
      expect(input.value).toBe('50');

      fireEvent.change(input, { target: { value: '75' } });
      expect(handleChange).toHaveBeenCalledWith('75');
    });

    it('does not trigger onChange when readOnly is true', () => {
      const handleChange = vi.fn();
      render(<NumInput val={50} onChange={handleChange} readOnly={true} />);
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '90' } });
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('SegBtn', () => {
    it('triggers onSelect when clicked', () => {
      const handleSelect = vi.fn();
      render(<SegBtn code="ETB" label="Existing Customer" active="NTB" onSelect={handleSelect} />);
      expect(screen.getByText('ETB')).toBeInTheDocument();
      expect(screen.getByText('Existing Customer')).toBeInTheDocument();

      fireEvent.click(screen.getByText('ETB'));
      expect(handleSelect).toHaveBeenCalledWith('ETB');
    });
  });

  describe('Toast', () => {
    it('renders active toasts with messages and icons', () => {
      const toasts = [
        { id: 1, type: 'success', msg: 'Entry saved successfully' },
        { id: 2, type: 'error', msg: 'Network request failed' },
      ];
      render(<Toast toasts={toasts} />);
      expect(screen.getByText('Entry saved successfully')).toBeInTheDocument();
      expect(screen.getByText('Network request failed')).toBeInTheDocument();
    });
  });

  describe('Field', () => {
    it('renders label, hint, and children', () => {
      render(
        <Field label="Opening Balance" hint="(Automated)">
          <input data-testid="field-input" />
        </Field>
      );
      expect(screen.getByText('Opening Balance')).toBeInTheDocument();
      expect(screen.getByText('(Automated)')).toBeInTheDocument();
      expect(screen.getByTestId('field-input')).toBeInTheDocument();
    });
  });

  describe('UBLLogo', () => {
    it('renders logo image with alt text', () => {
      render(<UBLLogo />);
      const img = screen.getByAltText('UBL');
      expect(img).toBeInTheDocument();
      expect(img).toHaveStyle({ width: '38px', height: '38px' });
    });
  });
});

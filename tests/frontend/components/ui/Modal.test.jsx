import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Modal from '../../../../src/components/ui/Modal.jsx';

describe('Modal Component', () => {
  it('returns null when modal prop is null', () => {
    const { container } = render(<Modal modal={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title, message, and default OK button', () => {
    const handleClose = vi.fn();
    const modalData = {
      type: 'success',
      title: 'Action Successful',
      msg: 'Your record has been saved.',
    };

    render(<Modal modal={modalData} onClose={handleClose} />);

    expect(screen.getByText('Action Successful')).toBeInTheDocument();
    expect(screen.getByText('Your record has been saved.')).toBeInTheDocument();

    const okButton = screen.getByText('OK');
    expect(okButton).toBeInTheDocument();
    fireEvent.click(okButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders custom buttons and triggers their onClick handlers', () => {
    const handleClose = vi.fn();
    const customClick = vi.fn();

    const modalData = {
      type: 'warn',
      title: 'Confirm Reset',
      msg: 'Are you sure?',
      buttons: [
        { label: 'Cancel', type: 'secondary' },
        { label: 'Confirm', type: 'primary', onClick: customClick },
      ],
    };

    render(<Modal modal={modalData} onClose={handleClose} />);

    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    expect(customClick).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});

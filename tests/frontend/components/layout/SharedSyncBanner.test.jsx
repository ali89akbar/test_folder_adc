import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SharedSyncBanner from '../../../../src/components/layout/SharedSyncBanner.jsx';

describe('SharedSyncBanner Component', () => {
  it('renders site pill for the current site', () => {
    const { rerender } = render(<SharedSyncBanner currentSite="KHI" />);
    expect(screen.getByText('KHI')).toBeInTheDocument();

    rerender(<SharedSyncBanner currentSite="LHE" />);
    expect(screen.getByText('LHE')).toBeInTheDocument();
  });
});

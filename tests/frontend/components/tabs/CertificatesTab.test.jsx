import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CertificatesTab from '../../../../src/components/tabs/CertificatesTab.jsx';

describe('CertificatesTab Component', () => {
  it('renders Destruction Certificates header and active site', () => {
    render(<CertificatesTab entries={[]} currentSite="KHI" />);

    expect(screen.getByText('Destruction Certificates')).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE SITE: KHI/i)).toBeInTheDocument();
    expect(screen.getByText(/Review site damaged inventory aggregations/i)).toBeInTheDocument();
  });

  it('renders error banner when error prop is provided', () => {
    render(<CertificatesTab entries={[]} currentSite="LHE" error="Failed to load damaged records" />);

    expect(screen.getByText('Failed to load damaged records')).toBeInTheDocument();
  });
});

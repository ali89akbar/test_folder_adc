import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Card, CardHeader } from '../../../../src/components/ui/Card.jsx';

describe('Card & CardHeader Components', () => {
  it('renders Card with children and styles', () => {
    render(
      <Card style={{ margin: '10px' }}>
        <div data-testid="card-child">Card Content</div>
      </Card>
    );

    const child = screen.getByTestId('card-child');
    expect(child).toBeInTheDocument();
    expect(child.parentElement).toHaveStyle({ margin: '10px' });
  });

  it('renders CardHeader with step, title, sub, and badge', () => {
    render(
      <CardHeader
        step="1"
        title="Card Details"
        sub="Sub-header text"
        badge={<span data-testid="badge">Active</span>}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Card Details')).toBeInTheDocument();
    expect(screen.getByText('Sub-header text')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });
});

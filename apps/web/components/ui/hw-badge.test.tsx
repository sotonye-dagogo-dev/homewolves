import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HwBadge } from './hw-badge';

describe('HwBadge', () => {
  it('renders label text', () => {
    render(<HwBadge>For Sale</HwBadge>);
    expect(screen.getByText('For Sale')).toBeInTheDocument();
  });

  it('applies variant-specific classes', () => {
    render(<HwBadge variant="sale">For Sale</HwBadge>);
    const badge = screen.getByText('For Sale');
    expect(badge).toHaveClass('bg-[var(--color-info-bg)]', 'text-[var(--color-info)]');
  });

  it('defaults to the default variant', () => {
    render(<HwBadge>Default</HwBadge>);
    expect(screen.getByText('Default')).toHaveClass('bg-muted', 'text-muted-foreground');
  });

  it('merges custom className', () => {
    render(<HwBadge className="custom">Merged</HwBadge>);
    expect(screen.getByText('Merged')).toHaveClass('custom');
  });
});

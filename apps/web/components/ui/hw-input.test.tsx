import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HwInput } from './hw-input';

describe('HwInput', () => {
  it('renders a high-contrast solid field by default', () => {
    render(<HwInput placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search');
    // Opaque token bg + primary text guarantee legibility (form audit).
    expect(input.className).toContain('bg-[var(--color-bg-input)]');
    expect(input.className).toContain('text-[var(--color-text-primary)]');
  });

  it('renders a pill glass field when glass is set', () => {
    render(<HwInput placeholder="Search" glass />);
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveClass('rounded-full');
  });

  it('renders a rounded form field when glass is disabled', () => {
    render(<HwInput placeholder="Name" glass={false} />);
    const input = screen.getByPlaceholderText('Name');
    expect(input).toHaveClass('rounded-md');
    expect(input).not.toHaveClass('rounded-full');
  });

  it('forwards value and change events', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HwInput aria-label="email" onChange={onChange} />);
    await user.type(screen.getByLabelText('email'), 'abc');
    expect(onChange).toHaveBeenCalled();
  });

  it('merges custom className', () => {
    render(<HwInput placeholder="Name" className="extra" />);
    expect(screen.getByPlaceholderText('Name')).toHaveClass('extra');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<HwInput placeholder="Name" disabled />);
    expect(screen.getByPlaceholderText('Name')).toBeDisabled();
  });

  it('renders an error message with alert role', () => {
    render(<HwInput placeholder="Name" error="Required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
    expect(screen.getByPlaceholderText('Name')).toHaveAttribute('aria-invalid', 'true');
  });
});

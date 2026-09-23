import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TopNav } from './top-nav';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('@/hooks/use-platform-config', () => ({
  useBrand: () => ({ data: { companyName: 'Homewolves', logoUrl: '' } }),
}));

vi.mock('@/hooks/use-require-auth', () => ({
  useRequireAuth: () => ({ requireAuth: () => true }),
}));

describe('TopNav', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders main navigation landmarks', () => {
    render(<TopNav />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('does not render a navbar search box (search lives on the hero / properties page only)', () => {
    render(<TopNav />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/search properties/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    const searchBtn = screen.queryByRole('button', { name: /search/i });
    expect(searchBtn).not.toBeInTheDocument();
    const searchLink = screen.queryByRole('link', { name: /search/i });
    expect(searchLink).not.toBeInTheDocument();
  });

  it('renders primary nav links and Post Property CTA', () => {
    render(<TopNav />);
    expect(screen.getByRole('link', { name: 'Properties' })).toHaveAttribute('href', '/properties');
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    expect(screen.getByRole('button', { name: 'Post Property' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/dashboard/client');
    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute('href', '/dashboard/notifications');
  });

  it('exposes a working mobile menu toggle', () => {
    render(<TopNav />);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    act(() => {
      fireEvent.click(toggle);
    });
    expect(screen.getByRole('dialog', { name: 'Mobile navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });
});

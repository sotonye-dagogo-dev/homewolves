import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MobileBar } from './mobile-bar';

let pathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : String(href)} {...rest}>
      {children}
    </a>
  ),
}));

describe('MobileBar', () => {
  beforeEach(() => {
    pathname = '/';
    cleanup();
  });

  it('renders three nav tabs plus the Post property button', () => {
    render(<MobileBar />);
    expect(screen.getByRole('navigation', { name: 'Bottom navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore properties' })).toHaveAttribute('href', '/properties');
    expect(screen.getByRole('link', { name: 'Messages' })).toHaveAttribute('href', '/messages');
    expect(screen.getByRole('link', { name: 'Client dashboard' })).toHaveAttribute('href', '/dashboard/client');
    expect(screen.getByRole('link', { name: 'Post property' })).toHaveAttribute(
      'href',
      '/dashboard/agent/listings/new',
    );
  });

  it('does not include a Search tab', () => {
    render(<MobileBar />);
    expect(screen.queryByRole('link', { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
  });

  it('marks exactly one tab active for the current path', () => {
    pathname = '/properties';
    render(<MobileBar />);
    const active = screen.getAllByRole('link').filter((el) => el.getAttribute('data-state') === 'active');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('href', '/properties');
  });

  it('marks Profile active on the client dashboard', () => {
    pathname = '/dashboard/client';
    render(<MobileBar />);
    const active = screen.getAllByRole('link').filter((el) => el.getAttribute('data-state') === 'active');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('href', '/dashboard/client');
  });
});

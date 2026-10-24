import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

vi.mock('@/hooks/use-platform-config', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/use-platform-config')>();
  return {
    ...original,
    useBrand: () => ({
      data: {
        logoUrl: '/logo.png',
        faviconUrl: '/favicon.ico',
        ogImageUrl: '/og-image.png',
        companyName: 'Homewolves',
        tagline: 'African Real Estate Operating System',
        developerCreditLabel: 'Built by S.D.',
        developerCreditUrl: 'https://sotonye-dagogo.is-a.dev',
      },
    }),
  };
});

describe('Footer', () => {
  it('renders all three nav link columns', () => {
    render(<Footer />);
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Properties' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('shows the config-driven developer credit linking to the portfolio', () => {
    render(<Footer />);
    const credit = screen.getByRole('link', { name: 'Built by S.D.' });
    expect(credit.getAttribute('href')).toBe('https://sotonye-dagogo.is-a.dev');
    expect(credit.getAttribute('target')).toBe('_blank');
    expect(credit.getAttribute('rel')).toContain('noopener');
    expect(credit.style.color).toBe('var(--color-brand-accent)');
  });

  it('keeps copyright and credit in one credit line', () => {
    render(<Footer />);
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });
});

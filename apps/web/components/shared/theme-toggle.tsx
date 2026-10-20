'use client';

import { Contrast, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/shared/ThemeProvider';

const ORDER = ['light', 'dark', 'high-contrast'] as const;

/**
 * Platform-wide floating theme control.
 *
 * Rendered once from the root layout so it is available on every public,
 * auth, and dashboard page (previously the only controls lived inside two
 * dashboard screens). Sits above the mobile bottom bar and is safe-area aware.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'light';
  const label =
    theme === 'dark'
      ? 'Switch to high contrast'
      : theme === 'high-contrast'
        ? 'Switch to light theme'
        : 'Switch to dark theme';
  const Icon = theme === 'dark' ? Contrast : theme === 'high-contrast' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="fixed right-4 z-[150] grid h-11 w-11 place-items-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:!bottom-6"
      style={{
        bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--color-bg-elevated)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{theme}</span>
    </button>
  );
}

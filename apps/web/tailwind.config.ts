import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg-base)',
        foreground: 'var(--color-text-primary)',
        /* Raw design tokens that feature code consumes as semantic
           utilities (bg-elevated, border-subtle, bg-canvas, …). Mapping
           them here keeps them theme-reactive instead of silently
           generating no CSS. */
        elevated: 'var(--color-bg-elevated)',
        canvas: 'var(--color-bg-canvas)',
        glass: 'var(--color-bg-glass)',
        overlay: 'var(--color-bg-overlay)',
        subtle: 'var(--color-border-subtle)',
        strong: 'var(--color-border-strong)',
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
          'accent-alt': 'var(--color-brand-accent-alt)',
        },
        primary: {
          DEFAULT: 'var(--color-brand-primary)',
          foreground: 'var(--color-text-inverse)',
        },
        secondary: {
          DEFAULT: 'var(--color-brand-secondary)',
          foreground: 'var(--color-text-inverse)',
        },
        accent: {
          DEFAULT: 'var(--color-brand-accent)',
          foreground: 'var(--color-text-inverse)',
        },
        muted: {
          DEFAULT: 'var(--color-bg-elevated)',
          foreground: 'var(--color-text-muted)',
        },
        card: {
          DEFAULT: 'var(--color-bg-elevated)',
          foreground: 'var(--color-text-primary)',
        },
        border: 'var(--color-border-default)',
        destructive: {
          DEFAULT: 'var(--color-error)',
          foreground: 'var(--color-text-inverse)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          foreground: 'var(--color-text-inverse)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-text-inverse)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          foreground: 'var(--color-text-inverse)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        32: 'var(--space-32)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        md: 'var(--text-md)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        hero: 'var(--text-hero)',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        card: 'var(--shadow-card)',
        hover: 'var(--shadow-hover)',
        glass: 'var(--shadow-glass)',
      },
      keyframes: {
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'skeleton-shimmer': 'skeleton-shimmer 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

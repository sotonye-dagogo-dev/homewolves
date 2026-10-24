// ─── CONFIG-DRIVEN DESIGN TOKENS ─────────────────────────────
// Admin-editable config can reference a design token by key (e.g.
// `success`, `accent`). Resolution happens at render time to a CSS
// custom property so every theme (light/dark/high-contrast) re-colours
// automatically without hardcoded hex values.

const TOKEN_VARS = {
  accent: '--color-brand-accent',
  'accent-alt': '--color-brand-accent-alt',
  primary: '--color-brand-primary',
  secondary: '--color-brand-secondary',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
  tag: '--color-tag',
  foreground: '--color-text-primary',
  muted: '--color-text-muted',
} as const;

export type DesignToken = keyof typeof TOKEN_VARS;

export const DESIGN_TOKEN_KEYS = Object.keys(TOKEN_VARS) as DesignToken[];

export function isDesignToken(value: unknown): value is DesignToken {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TOKEN_VARS, value);
}

/**
 * Resolve a config-supplied token key to a theme-aware `var(--…)` string.
 * Malformed or unknown values fall back to a safe default so a stale admin
 * row can never produce an invisible/unparseable colour.
 */
export function designTokenVar(token: unknown, fallback: DesignToken = 'accent'): string {
  const key = isDesignToken(token) ? token : fallback;
  return `var(${TOKEN_VARS[key]})`;
}

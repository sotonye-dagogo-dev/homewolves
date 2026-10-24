import { describe, it, expect } from 'vitest';
import { designTokenVar, isDesignToken, DESIGN_TOKEN_KEYS } from './design-tokens';

describe('designTokenVar', () => {
  it('resolves known token keys to theme-aware CSS variables', () => {
    expect(designTokenVar('success')).toBe('var(--color-success)');
    expect(designTokenVar('accent')).toBe('var(--color-brand-accent)');
    expect(designTokenVar('primary')).toBe('var(--color-brand-primary)');
  });

  it('falls back safely for unknown or malformed admin values', () => {
    expect(designTokenVar('neon-pink')).toBe('var(--color-brand-accent)');
    expect(designTokenVar('')).toBe('var(--color-brand-accent)');
    expect(designTokenVar(null)).toBe('var(--color-brand-accent)');
    expect(designTokenVar(42)).toBe('var(--color-brand-accent)');
    expect(designTokenVar(undefined, 'success')).toBe('var(--color-success)');
  });

  it('honours a caller-supplied fallback token', () => {
    expect(designTokenVar('not-a-token', 'info')).toBe('var(--color-info)');
  });

  it('exposes only allow-listed token keys', () => {
    expect(DESIGN_TOKEN_KEYS).toContain('success');
    expect(isDesignToken('success')).toBe(true);
    expect(isDesignToken('constructor')).toBe(false);
    expect(isDesignToken({})).toBe(false);
  });
});

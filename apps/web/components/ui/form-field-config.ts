/**
 * Shared form-field config — single source of truth for input/select/textarea
 * styling. Every Hw* field wrapper resolves visuals from an optional
 * `config` prop first, then these FALLBACK_* constants, then design tokens.
 * Nothing is hardcoded in feature code.
 */

export interface FormFieldConfig {
  /** Corner radius: pill (search) vs rounded (forms). Defaults to rounded. */
  radius?: 'pill' | 'rounded';
  /** Visual tone. `solid` guarantees opaque bg + AA text contrast. */
  tone?: 'solid' | 'glass';
}

export const FALLBACK_FORM_FIELD: Required<FormFieldConfig> = {
  radius: 'rounded',
  tone: 'solid',
};

const BASE =
  'w-full font-body text-base outline-none transition-all duration-fast ' +
  'text-[var(--color-text-primary)] bg-[var(--color-bg-input)] ' +
  'border border-[var(--color-border-default)] ' +
  'placeholder:text-[var(--color-text-muted)] ' +
  'focus:ring-2 focus:ring-[rgba(45,106,159,0.35)] focus:border-[var(--color-brand-secondary)] ' +
  'disabled:bg-[var(--color-bg-input-disabled)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-[var(--color-error)]';

export function formFieldClassName(config?: FormFieldConfig, glassLegacy?: boolean): string {
  const merged = { ...FALLBACK_FORM_FIELD, ...config };
  // Back-compat: legacy `glass` boolean maps onto the tone axis AND implies
  // the historic pill radius unless the caller overrides radius explicitly.
  const tone = glassLegacy === true ? 'glass' : glassLegacy === false ? 'solid' : merged.tone;
  const radius = config?.radius ?? (glassLegacy === true ? 'pill' : merged.radius);
  const shape = radius === 'pill' ? 'rounded-full px-4 py-2' : 'rounded-md px-4 py-3 min-h-[52px]';
  const surface =
    tone === 'glass'
      ? 'bg-[var(--color-bg-input)]/90 backdrop-blur-lg shadow-glass'
      : 'shadow-xs';
  return `${BASE} ${shape} ${surface}`;
}

export const FORM_FIELD_ERROR_CLASS =
  'text-sm font-medium mt-1.5 text-[var(--color-error)]';

export const FORM_FIELD_LABEL_CLASS =
  'block text-sm font-semibold mb-1.5 text-[var(--color-text-secondary)]';

/**
 * Shared inline surface style for raw (non-Hw*) inputs/selects.
 * Pairs `color` with the theme-aware `--color-bg-input` token so text is
 * never white-on-white: light theme → dark text on white, dark theme →
 * light text on dark. Import this instead of hardcoding `#FFFFFF`.
 */
export const FORM_FIELD_SURFACE_STYLE = {
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-bg-input)',
} as const;

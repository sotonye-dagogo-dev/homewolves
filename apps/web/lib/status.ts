import type { CSSProperties } from 'react';

export interface StatusTone {
  background: string;
  color: string;
  borderColor: string;
}

const TONES: Record<string, StatusTone> = {
  success: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-status-active)',
    borderColor: 'var(--color-status-active)',
  },
  warning: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-status-pending)',
    borderColor: 'var(--color-status-pending)',
  },
  error: {
    background: 'var(--color-error-bg)',
    color: 'var(--color-status-rejected)',
    borderColor: 'var(--color-status-rejected)',
  },
  info: {
    background: 'var(--color-info-bg)',
    color: 'var(--color-brand-primary)',
    borderColor: 'var(--color-brand-primary)',
  },
  neutral: {
    background: 'var(--color-bg-base)',
    color: 'var(--color-text-secondary)',
    borderColor: 'var(--color-border-default)',
  },
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  COMPLETED: 'success',
  CONFIRMED: 'success',
  APPROVED: 'success',
  ACTIVE: 'success',
  PUBLISHED: 'success',
  IN_PROGRESS: 'warning',
  PENDING: 'warning',
  INITIATED: 'info',
  UNDER_REVIEW: 'info',
  DRAFT: 'neutral',
  REJECTED: 'error',
  FAILED: 'error',
  CANCELLED: 'neutral',
  CANCELED: 'neutral',
  SUSPENDED: 'error',
};

export function statusTone(status?: string | null): StatusTone {
  const key = STATUS_TONE[(status ?? '').toUpperCase()] ?? 'neutral';
  return (TONES[key] ?? TONES.neutral)!;
}

export function statusToneStyle(status?: string | null): CSSProperties {
  const tone = statusTone(status);
  return {
    background: tone.background,
    color: tone.color,
    border: `1px solid ${tone.borderColor}`,
  };
}

/** Extra tone families beyond the status statuses (tokens defined in globals.css). */
const EXTRA_TONES: Record<string, StatusTone> = {
  tag: {
    background: 'var(--color-tag-bg)',
    color: 'var(--color-tag)',
    borderColor: 'var(--color-tag)',
  },
};

export type ChipTone = keyof typeof TONES | keyof typeof EXTRA_TONES;

/** Style helper for semantic chip families (success/warning/info/error/neutral/tag). */
export function chipToneStyle(tone: ChipTone | string): CSSProperties {
  const t = (EXTRA_TONES[tone] ?? TONES[tone] ?? TONES.neutral) as StatusTone;
  return {
    background: t.background,
    color: t.color,
    border: `1px solid ${t.borderColor}`,
  };
}

/** Client-CRM record states → tone family (token-driven, theme-reactive). */
export const CLIENT_STATUS_TONE: Record<string, ChipTone> = {
  active: 'success',
  pending: 'warning',
  documentation: 'info',
  closed: 'tag',
  rejected: 'error',
};

/** Tier badges have dark surfaces + light text so they stay AA in every theme. */
export const TIER_BADGE_STYLE: Record<string, CSSProperties> = {
  diamond: { background: '#4C1D95', color: '#E9D5FF' },
  platinum: { background: '#312E81', color: '#C7D2FE' },
  gold: { background: '#78350F', color: '#FDE68A' },
  silver: { background: '#374151', color: '#E5E7EB' },
  bronze: { background: '#7C2D12', color: '#FED7AA' },
};

export function tierBadgeStyle(tier?: string | null): CSSProperties {
  return (TIER_BADGE_STYLE[(tier ?? '').toLowerCase()] ?? TIER_BADGE_STYLE.bronze)!;
}

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

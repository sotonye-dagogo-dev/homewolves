'use client';

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Centered, accessible empty state used across the platform.
 * Guarantees consistent spacing + messaging instead of ad-hoc blocks.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  children,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'} ${className}`}
      role="status"
    >
      <span
        className="mb-4 grid h-14 w-14 place-items-center rounded-full"
        style={{
          background: 'var(--color-bg-glass)',
          border: '1px solid var(--color-border-glass)',
          color: 'var(--color-text-muted)',
        }}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </span>
      <h3
        className="text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h3>
      {description ? (
        <p
          className="mt-1.5 max-w-sm text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors"
          style={{
            background: 'var(--color-brand-accent)',
            color: 'var(--color-text-inverse)',
          }}
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors"
          style={{
            background: 'var(--color-brand-accent)',
            color: 'var(--color-text-inverse)',
          }}
        >
          {actionLabel}
        </button>
      ) : null}
      {children}
    </div>
  );
}

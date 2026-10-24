'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useMapConfig } from '@/hooks/use-platform-config';
import { FALLBACK_MAP_CONFIG } from '@/config/fallbacks';

/**
 * Pure resolver for the map info tag. Merges admin `map_config.credit`
 * over defaults field-by-field (a stale/partial DB row can never blank
 * the credit unintentionally) and rejects malformed values so the tag
 * never renders an empty or non-http link.
 */
export function normalizeMapCredit(
  configCredit?: Partial<MapCreditConfig> | null,
): { enabled: boolean; label: string; href: string } | null {
  const merged = {
    ...FALLBACK_MAP_CONFIG.credit,
    ...(configCredit ?? {}),
  };
  if (merged.enabled !== true) return null;
  if (typeof merged.label !== 'string' || merged.label.trim().length === 0) return null;
  if (typeof merged.href !== 'string' || !/^https?:\/\//i.test(merged.href)) return null;
  return { enabled: merged.enabled, label: merged.label, href: merged.href };
}

/** Live hook variant of {@link normalizeMapCredit} driven by PlatformConfig. */
export function useMapCredit(): { enabled: boolean; label: string; href: string } | null {
  const { data: config } = useMapConfig();
  return normalizeMapCredit(config?.credit ?? null);
}

/**
 * Renders the map info tag ("Powered by Along" by default). Positions
 * itself with `className` so the same component works as a corner
 * overlay on the live canvas or an inline row on the fallback card.
 */
export function MapCreditTag({ className }: { className?: string }) {
  const credit = useMapCredit();
  if (!credit) return null;
  return (
    <Link
      href={credit.href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="map-credit-tag"
      aria-label={`${credit.label} (opens in a new tab)`}
      className={[
        'pointer-events-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm backdrop-blur-[var(--glass-blur-subtle)] transition-colors duration-fast hover:underline',
        className ?? '',
      ].join(' ')}
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-default)',
        color: 'var(--color-text-secondary)',
      }}
    >
      {credit.label}
      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
    </Link>
  );
}

export default MapCreditTag;

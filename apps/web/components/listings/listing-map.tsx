'use client';

import type { CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import HwMap, { MapLocationFallback } from '@/components/map/hw-map';
import { useFeatureFlag, useMapConfig } from '@/hooks/use-platform-config';
import { useListingPin } from '@/hooks/use-listing-pin';

const SECTION_STYLE: CSSProperties = {
  background: 'var(--color-bg-glass)',
  border: '1px solid var(--color-border-default)',
};

/**
 * §4.3 Zone 7 — Location map on the listing detail page.
 * Config-driven end to end: `map_view` feature flag controls rendering;
 * pins resolve exact submitted coordinates first, then geocode
 * city/area/state (marked approximate); every failure path lands on a
 * styled location card with an outbound OpenStreetMap link.
 */
export function ListingMapSection({
  location,
  title,
  price,
  listingId,
}: {
  location?: Record<string, unknown> | null;
  title: string;
  price?: string;
  listingId?: string;
}) {
  const { enabled: mapEnabled } = useFeatureFlag('map_view');
  const { data: config } = useMapConfig();
  const { pin, loading } = useListingPin(location);

  const areaText = [
    location?.area,
    location?.city,
    location?.state,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(', ');

  const body = (() => {
    if (!mapEnabled) {
      return (
        <MapLocationFallback title="Location" description={areaText} />
      );
    }
    if (loading) {
      return (
        <div
          className="w-full rounded-xl flex items-center justify-center gap-2 animate-pulse"
          style={{ ...SECTION_STYLE, minHeight: 240 }}
        >
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Locating property…
          </span>
        </div>
      );
    }
    const markers = pin
      ? [
          {
            id: listingId ?? 'listing',
            lat: pin.lat,
            lng: pin.lng,
            title,
            price,
            approximate: pin.source === 'approximate',
          },
        ]
      : [];
    return (
      <HwMap
        markers={markers}
        height={320}
        zoom={config?.detailZoom ?? 15}
        center={config?.defaultCenter}
        ariaLabel={`Map of ${areaText || title}`}
        testId="listing-map"
        fallback={{
          title: 'Exact location not available',
          description: areaText || title,
        }}
      />
    );
  })();

  return (
    <section className="flex flex-col gap-3" data-testid="listing-map-section">
      <h2
        className="font-bold text-2xl"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        Location
      </h2>
      {areaText && (
        <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
          Neighborhood:
          {' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>{areaText}</strong>
        </p>
      )}
      {body}
      {pin?.source === 'approximate' && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Map location is approximate — synced from the neighborhood.
        </p>
      )}
    </section>
  );
}

export default ListingMapSection;

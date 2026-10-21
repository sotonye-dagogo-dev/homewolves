'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationQueryText, resolveListingCoords } from '@/lib/map/config';
import { FALLBACK_MAP_CONFIG } from '@/config/fallbacks';

export interface ListingPin {
  lat: number;
  lng: number;
  /** 'exact' = submitted coordinates; 'approximate' = server geocode of city/area */
  source: 'exact' | 'approximate';
}

interface GeocodeResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
}

/**
 * Resolves a map pin for a listing: exact submitted coordinates win;
 * otherwise the listing's area/city/state text is geocoded once (server
 * proxied, keyless, cached) and marked approximate. Never throws —
 * unresolved pins are `null` so callers render their fallback.
 */
export function useListingPin(
  location: Record<string, unknown> | null | undefined,
): { pin: ListingPin | null; loading: boolean } {
  const coords = resolveListingCoords(location);

  const probeText = useMemo(() => locationQueryText(location), [location]);

  const geocode = useQuery<GeocodeResult[]>({
    queryKey: ['listing-geocode', probeText],
    enabled: !coords && Boolean(probeText),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const endpoint = FALLBACK_MAP_CONFIG.geocode.endpoint;
      const url = `${endpoint}?q=${encodeURIComponent(probeText!)}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 400 && body.error === 'missing-query') return [];
        throw new Error(`geocode failed (${res.status})`);
      }
      const body = (await res.json()) as { results?: unknown };
      return Array.isArray(body?.results) ? (body.results as GeocodeResult[]) : [];
    },
  });

  return useMemo(() => {
    if (coords) return { pin: { ...coords, source: 'exact' as const }, loading: false };
    if (probeText && geocode.isFetching) return { pin: null, loading: true };
    const first = geocode.data?.[0];
    if (first) return { pin: { lat: first.lat, lng: first.lng, source: 'approximate' }, loading: false };
    return { pin: null, loading: false };
  }, [coords, probeText, geocode.isFetching, geocode.data]);
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { buildListingMarkers, locationQueryText, resolveListingCoords } from '@/lib/map/config';
import { formatPrice } from '@/lib/format-price';

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
 * Builds map markers for a filtered listing set on the properties map view.
 * Listings with submitted coordinates resolve instantly (exact); the rest
 * are geocoded by their unique city/area/state query strings — one cached
 * server-proxied pass, marked approximate. Marker count is capped by the
 * `map_config.maxMarkers` budget so huge result sets stay cheap to render.
 */
export function usePropertyMapMarkers(
  listings: any[],
  maxMarkers = 200,
): { markers: ReturnType<typeof buildListingMarkers>; geocoding: boolean } {
  const { exact, perQuery } = (() => {
    const exactArr: ReturnType<typeof buildListingMarkers> = [];
    const missing: Array<{ id: string; query: string }> = [];
    for (const listing of listings) {
      const coords = resolveListingCoords(listing?.locationJson);
      if (coords) {
        exactArr.push({
          id: listing.id,
          lat: coords.lat,
          lng: coords.lng,
          title: listing.title,
          price: listing.price != null ? formatPrice(listing.price, listing.currency) : undefined,
          href: `/properties/${listing.id}`,
        });
      } else {
        const query = locationQueryText(listing?.locationJson);
        if (query) missing.push({ id: listing.id, query });
      }
    }
    const perQueryMap = new Map<string, string[]>();
    for (const entry of missing) {
      const bucket = perQueryMap.get(entry.query);
      if (bucket) bucket.push(entry.id);
      else perQueryMap.set(entry.query, [entry.id]);
    }
    return { exact: exactArr, perQuery: Array.from(perQueryMap.entries()) };
  })();

  const queryKeyPart = exact.length === 0 && perQuery.length === 0 ? 'empty' : perQuery.map(([q]) => q).sort();

  const geocode = useQuery<Record<string, { lat: number; lng: number }>>({
    queryKey: ['property-map-geocodes', queryKeyPart],
    enabled: perQuery.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const out: Record<string, { lat: number; lng: number }> = {};
      for (const [query] of perQuery) {
        try {
          const res = await fetch(`/api/v1/maps/geocode?q=${encodeURIComponent(query)}&limit=1`);
          if (res.ok) {
            const body = (await res.json()) as { results?: GeocodeResult[] };
            const first = body.results?.[0];
            if (first) out[query] = { lat: first.lat, lng: first.lng };
          }
        } catch {
          // Graceful: skip unfetchable queries; map still renders exact pins
        }
      }
      return out;
    },
  });

  const approx: ReturnType<typeof buildListingMarkers> = [];
  if (geocode.data) {
    const cap = Math.max(0, maxMarkers - exact.length);
    for (const [query, ids] of perQuery) {
      const hit = geocode.data[query];
      if (!hit) continue;
      for (const id of ids) {
        if (approx.length >= cap) break;
        const listing = listings.find((l) => l?.id === id);
        approx.push({
          id,
          lat: hit.lat,
          lng: hit.lng,
          title: listing?.title,
          price: listing?.price != null ? formatPrice(listing.price, listing.currency) : undefined,
          href: `/properties/${id}`,
          approximate: true,
        });
      }
    }
  }

  return { markers: [...exact, ...approx], geocoding: geocode.isFetching && exact.length === 0 };
}

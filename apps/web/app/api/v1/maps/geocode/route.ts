import { NextRequest, NextResponse } from 'next/server';

// ─── Keyless geocode proxy (server-side only) ───────────────
// Approach adapted from along-app: geocoder upstreams are never called
// browser-direct (usage policy + response normalization). Keyless
// providers — Photon (primary), OSM Nominatim (fallback) — require no
// API keys. Results are cached in-process; upstream failures resolve to
// an empty result set with 200 so background geocoding never breaks a page.

const DEFAULT_UA = 'Homewolves/1.0 (+https://homewolves.com)';
const MAX_LIMIT = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 500;

export interface GeocodeResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  /** provider-reported kind, when available */
  type?: string;
}

interface CacheEntry {
  at: number;
  results: GeocodeResult[];
}

const cache = new Map<string, CacheEntry>();

function pruneCache() {
  if (cache.size <= CACHE_MAX) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.at > CACHE_TTL_MS) cache.delete(key);
  }
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? parseFloat(value) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizePhoton(data: any): GeocodeResult[] {
  const features = Array.isArray(data?.features) ? data.features : [];
  return features
    .map((feature: any, idx: number) => {
      const props = feature?.properties ?? {};
      const lat = num(feature?.geometry?.coordinates?.[1]);
      const lng = num(feature?.geometry?.coordinates?.[0]);
      if (lat === null || lng === null) return null;
      const labelParts = [props.name, props.city, props.state, props.country].filter(Boolean);
      const label = labelParts.length > 0 ? labelParts.join(', ') : props.street ?? null;
      if (!label) return null;
      return {
        id: `photon-${idx}-${lat},${lng}`,
        label,
        lat,
        lng,
        city: props.city ?? props.county,
        state: props.state,
        country: props.country,
        type: props.osm_value ?? props.osm_key,
      } as GeocodeResult;
    })
    .filter(Boolean)
    .slice(0, MAX_LIMIT) as GeocodeResult[];
}

function normalizeNominatim(data: any): GeocodeResult[] {
  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((row: any, idx: number) => {
      const lat = num(row?.lat);
      const lng = num(row?.lon);
      if (lat === null || lng === null) return null;
      const label = typeof row?.display_name === 'string' && row.display_name.length > 0
        ? row.display_name
        : null;
      if (!label) return null;
      return {
        id: `osm-${idx}-${lat},${lng}`,
        label,
        lat,
        lng,
        city: row?.address?.city ?? row?.address?.town ?? row?.address?.village,
        state: row?.address?.state,
        country: row?.address?.country,
        type: row?.type,
      } as GeocodeResult;
    })
    .filter(Boolean)
    .slice(0, MAX_LIMIT) as GeocodeResult[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchJson(url: string, ua: string): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': ua,
        Accept: 'application/json',
        ...(new URL(url).hostname.includes('nominatim') ? { Referer: 'https://homewolves.com' } : {}),
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get('q') ?? '').trim();
  const limitRaw = parseInt(params.get('limit') ?? '5', 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT) : 5;
  const lat = num(params.get('lat'));
  const lng = num(params.get('lng'));

  if (q.length < 2) {
    return NextResponse.json({ results: [], error: 'missing-query' }, { status: 400 });
  }

  const cacheKey = `${q}|${limit}|${lat ?? ''}|${lng ?? ''}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at <= CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.results });
  }

  const ua = request.headers.get('user-agent') ?? DEFAULT_UA;

  // Photon (Komoot) — keyless primary; proximity params when the caller
  // supplies context coordinates for better local ranking.
  const photonUrl = new URL('https://photon.komoot.io/api/');
  photonUrl.searchParams.set('q', q);
  photonUrl.searchParams.set('limit', String(limit));
  if (lat !== null && lng !== null) {
    photonUrl.searchParams.set('lat', String(lat));
    photonUrl.searchParams.set('lon', String(lng));
  }
  const photon = await fetchJson(photonUrl.toString(), ua);
  let results = normalizePhoton(photon);

  // Nominatim — keyless OSM fallback (server-side, proper Identity headers).
  if (results.length === 0) {
    const osmUrl = new URL('https://nominatim.openstreetmap.org/search');
    osmUrl.searchParams.set('format', 'jsonv2');
    osmUrl.searchParams.set('addressdetails', '1');
    osmUrl.searchParams.set('dedupe', '1');
    osmUrl.searchParams.set('q', q);
    osmUrl.searchParams.set('limit', String(limit));
    const osm = await fetchJson(osmUrl.toString(), ua);
    results = normalizeNominatim(osm);
  }

  pruneCache();
  cache.set(cacheKey, { at: Date.now(), results });
  return NextResponse.json({ results });
}

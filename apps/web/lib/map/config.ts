// ─── Keyless map stack (config-driven) ──────────────────────
// Approach adapted from along-app (github.com/sotonye-dagogo-dev/along-app):
// MapLibre GL rendering, OpenFreeMap vector styles primary, keyless
// CARTO/OSM raster step-down on error, server-proxied keyless geocoding.
// Pure helpers here are unit-testable without any map library loaded.

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  price?: string;
  href?: string;
  /** approximate=true pins are geocoded from city/area, not submitted coords */
  approximate?: boolean;
}

/** MapLibre style object for a raster tile template URL (step-down layer). */
export function buildRasterMapStyle(
  tileUrl: string,
  attribution: string,
): Record<string, unknown> {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        maxzoom: 19,
        attribution,
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}

const DEFAULT_VECTOR_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_VECTOR_DARK = 'https://tiles.openfreemap.org/styles/liberty';

/** Full style stack: vector primary, raster fallbacks in order. Defensive
 * against partial/incomplete config shapes. */
export function buildMapStyleStack(
  config: Partial<MapConfig>,
  isDark: boolean,
): Array<string | Record<string, unknown>> {
  const primary = isDark
    ? config.vectorStyles?.dark ?? DEFAULT_VECTOR_DARK
    : config.vectorStyles?.light ?? DEFAULT_VECTOR_LIGHT;
  const stack: Array<string | Record<string, unknown>> = [primary];
  const raster = isDark
    ? config.rasterFallbacks?.dark ?? []
    : config.rasterFallbacks?.light ?? [];
  for (const tileUrl of raster) {
    stack.push(buildRasterMapStyle(tileUrl, config.attribution ?? '© OpenStreetMap contributors'));
  }
  return stack;
}

export function rasterFallbackDepth(config: MapConfig): number {
  return Math.max(config.rasterFallbacks.light.length, config.rasterFallbacks.dark.length);
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Resolves a listing's coordinates from the free-form `locationJson` blob.
 * Accepts `latitude`/`longitude` (the listing form contract) and
 * `lat`/`lng` (the PropertyLocation type contract); rejects NaN, 0,0
 * placeholders and out-of-range values.
 */
export function resolveListingCoords(
  location?: Record<string, unknown> | null,
): { lat: number; lng: number } | null {
  if (!location || typeof location !== 'object') return null;
  const lat = (location.latitude ?? location.lat) as unknown;
  const lng = (location.longitude ?? location.lng) as unknown;
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/** Best-effort probe text for geocoding a listing (area, city, state). */
export function locationQueryText(location?: Record<string, unknown> | null): string | null {
  if (!location || typeof location !== 'object') return null;
  const parts = [
    location.area as string | undefined,
    location.city as string | undefined,
    location.state as string | undefined,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());
  const text = parts.join(', ');
  return text.length > 0 ? text : null;
}

interface BuildMarkersOptions {
  max?: number;
  formatPrice?: (price: unknown, currency?: string) => string | undefined;
}

/** Builds valid, de-duplicated pins for a set of listings. */
export function buildListingMarkers(
  listings: Array<Record<string, unknown>>,
  options: BuildMarkersOptions = {},
): MapPin[] {
  const max = options.max ?? 200;
  const seen = new Set<string>();
  const pins: MapPin[] = [];
  for (const listing of listings) {
    const coords = resolveListingCoords(listing.locationJson as Record<string, unknown>);
    if (!coords) continue;
    const id = String(listing.id ?? `${coords.lat},${coords.lng}`);
    if (seen.has(id)) continue;
    seen.add(id);
    pins.push({
      id,
      lat: coords.lat,
      lng: coords.lng,
      title: typeof listing.title === 'string' ? listing.title : undefined,
      price: options.formatPrice
        ? options.formatPrice(listing.price, listing.currency as string | undefined)
        : typeof listing.price === 'number'
          ? String(listing.price)
          : undefined,
      href: typeof listing.id === 'string' ? `/properties/${listing.id}` : undefined,
    });
    if (pins.length >= max) break;
  }
  return pins;
}

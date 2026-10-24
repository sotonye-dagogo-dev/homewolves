// ─── Map Configuration ──────────────────────────────────────
// Admin-configurable map rendering (keyless stack by default:
// OpenFreeMap vector styles, CARTO/OSM raster fallbacks, server-proxied
// keyless geocoding). No API keys required in any default configuration.

interface MapGeocodeConfig {
  /** Server route that proxies geocoding (upstreams are never called browser-direct). */
  endpoint: string;
  /** Max geocode results returned per lookup. */
  limit: number;
  /** Client/server cache window in seconds. */
  cacheTtlSec: number;
}

/**
 * Partner credit shown as the map info tag (e.g. "Powered by Along"
 * linking to https://alongng.com). Admin-editable via `map_config`;
 * tile-provider attribution intentionally lives off the surface.
 */
interface MapCreditConfig {
  /** Render the info tag at all. */
  enabled: boolean;
  /** Short credit/CTA text. */
  label: string;
  /** Absolute https link the tag opens in a new tab. */
  href: string;
  /**
   * Design-token key for the tag's text colour (e.g. `success` → the
   * theme-aware `--color-success` variable). Unknown/missing values fall
   * back to `success` so the tag stays deliberately green in every theme.
   */
  colorToken?: string;
}

interface MapConfig {
  /** Keyless vector tile style URLs (MapLibre style JSON). */
  vectorStyles: {
    light: string;
    dark: string;
  };
  /**
   * Keyless raster style step-down chain (plain tile template URLs
   * using {z}/{x}/{y}). Used in order when the vector style fails.
   */
  rasterFallbacks: {
    light: string[];
    dark: string[];
  };
  /**
   * CSS filter applied to the map canvas in dark theme. "none" renders
   * exactly the same tiles in every theme (light tiles verified clearer
   * than inverted ones).
   */
  darkCanvasFilter: string;
  /** Camera fallback when no pins/coords exist (Lagos, NG). */
  defaultCenter: { lat: number; lng: number };
  /** Zoom used when no better fit exists. */
  defaultZoom: number;
  /** Zoom used for a single pin. */
  detailZoom: number;
  /** Basemap attribution string (raster style objects only). */
  attribution: string;
  /**
   * Partner/platform info tag ("Powered by Along" by default). Optional
   * for backward compatibility: absent values fall back to defaults,
   * and `enabled: false` hides the tag.
   */
  credit?: MapCreditConfig;
  geocode: MapGeocodeConfig;
  /** Hard cap on markers rendered in the browse map (perf guard). */
  maxMarkers: number;
  /** Pin fill (defaults to the brand accent value). */
  markerColor: string;
  /** Pin border (defaults to the brand primary value). */
  markerBorder: string;
}

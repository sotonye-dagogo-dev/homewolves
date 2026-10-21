'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ExternalLink, Loader2, MapPin } from 'lucide-react';
import { useMapConfig } from '@/hooks/use-platform-config';
import { buildMapStyleStack } from '@/lib/map/config';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  price?: string;
  href?: string;
  approximate?: boolean;
}

export interface HwMapProps {
  markers: MapMarker[];
  height?: number | string;
  center?: { lat: number; lng: number };
  zoom?: number;
  onPick?: (point: { lat: number; lng: number }) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
  /** Fallback content when no markers exist and picking isn't available. */
  fallback?: { title: string; description?: string; href?: string; hrefLabel?: string };
  ariaLabel?: string;
  testId?: string;
}

const MapCanvas = dynamic(() => import('./map-canvas'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div
      className="w-full rounded-md flex items-center justify-center animate-pulse"
      style={{
        height: '100%',
        minHeight: 200,
        background: 'var(--color-bg-canvas)',
      }}
    >
      <div className="flex flex-col items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  );
}

function useObservedTheme(): string {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const doc = document.documentElement;
    const read = () => setTheme(doc.getAttribute('data-theme') ?? 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(doc, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/**
 * Token-styled fallback card rendered when the map cannot render at all
 * (offline / WebGL unavailable / every tile source exhausted) or when a
 * listing has no coordinates and geocoding failed.
 */
export function MapLocationFallback({
  title,
  description,
  href,
  hrefLabel,
  style,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  style?: CSSProperties;
}) {
  const osmHref =
    href ?? (description ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(description)}` : undefined);
  return (
    <div
      data-testid="map-fallback"
      className="w-full rounded-xl flex flex-col items-center justify-center text-center gap-2 px-4"
      style={{
        background: 'var(--color-bg-glass)',
        border: '1px solid var(--color-border-default)',
        minHeight: 240,
        ...style,
      }}
    >
      <div
        className="w-12 h-12 rounded-full grid place-items-center"
        style={{ background: 'var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
      >
        <MapPin className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </p>
      {description && (
        <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {osmHref && (
        <Link
          href={osmHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
          style={{ color: 'var(--color-brand-secondary)' }}
        >
          {hrefLabel ?? 'Open in OpenStreetMap'} <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/**
 * HwMap — design-system map surface over the keyless MapLibre stack
 * (OpenFreeMap vector primary, keyless CARTO/OSM raster step-down).
 * Fails soft: skeleton while loading, style step-down on error, and a
 * final styled location card when rendering is impossible. Rendering
 * config comes from PlatformConfig `map_config` with FALLBACK_MAP_CONFIG.
 */
export function HwMap({
  markers,
  height = 320,
  center,
  zoom,
  onPick,
  selectedId,
  onSelect,
  className,
  style,
  fallback,
  ariaLabel,
  testId,
}: HwMapProps) {
  const { data: config } = useMapConfig();
  const theme = useObservedTheme();
  const isDark = theme !== 'light';
  const [failed, setFailed] = useState(false);

  const styleStack = useMemo(
    () => buildMapStyleStack(config ?? ({} as MapConfig), isDark),
    [config, isDark],
  );

  const hasMarkers = markers.length > 0;

  if (!hasMarkers && !onPick && fallback) {
    return (
      <div style={style} className={className} data-testid={testId}>
        <MapLocationFallback
          title={fallback.title}
          description={fallback.description}
          href={fallback.href}
          hrefLabel={fallback.hrefLabel}
        />
      </div>
    );
  }

  if (failed) {
    return (
      <div style={{ height, ...style }} className={className} data-testid={testId}>
        <MapLocationFallback
          title={fallback?.title ?? 'Map unavailable'}
          description={fallback?.description}
          href={fallback?.href}
          hrefLabel={fallback?.hrefLabel}
          style={{ height: '100%', minHeight: 'unset' }}
        />
      </div>
    );
  }

  return (
    <div style={style} className={className} data-testid={testId}>
      <MapCanvas
        styleStack={styleStack}
        markers={markers}
        height={height}
        center={center}
        zoom={zoom}
        onPick={onPick}
        selectedId={selectedId}
        onSelect={onSelect}
        markerColor={config?.markerColor}
        markerBorder={config?.markerBorder}
        canvasFilter={config?.darkCanvasFilter}
        aria-label={ariaLabel}
        onStyleExhausted={() => setFailed(true)}
      />
    </div>
  );
}

export default HwMap;

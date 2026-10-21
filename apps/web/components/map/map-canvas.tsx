'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Map, Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

export interface CanvasMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  price?: string;
  href?: string;
  approximate?: boolean;
}

export interface MapCanvasProps {
  /** Prebuilt MapLibre style stack: vector style URL first, raster objects after. */
  styleStack: Array<string | Record<string, unknown>>;
  markers: CanvasMarker[];
  height?: number | string;
  center?: { lat: number; lng: number };
  zoom?: number;
  onPick?: (point: { lat: number; lng: number }) => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  markerColor?: string;
  markerBorder?: string;
  canvasFilter?: string;
  className?: string;
  /** Fired once when every entry in the style stack has failed. */
  onStyleExhausted?: () => void;
  'aria-label'?: string;
}

export default function MapCanvas({
  styleStack,
  markers,
  height = 320,
  center,
  zoom = 12,
  onPick,
  selectedId,
  onSelect,
  markerColor,
  markerBorder,
  canvasFilter,
  className,
  onStyleExhausted,
  'aria-label': ariaLabel,
}: MapCanvasProps) {
  const [styleIdx, setStyleIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(selectedId ?? null);
  const firedExhaustedRef = useRef(false);

  // Style step-down: restart cleanly whenever the caller swaps the stack
  // (theme flips / config updates), then walk raster fallbacks on error.
  useEffect(() => {
    setStyleIdx(0);
    firedExhaustedRef.current = false;
  }, [styleStack]);

  useEffect(() => setSelected(selectedId ?? null), [selectedId]);

  const mapStyle = styleStack[Math.min(styleIdx, styleStack.length - 1)] as never;

  const handleMapError = () => {
    setStyleIdx((idx) => {
      if (idx >= styleStack.length - 1) {
        if (!firedExhaustedRef.current) {
          firedExhaustedRef.current = true;
          onStyleExhausted?.();
        }
        return idx;
      }
      return idx + 1;
    });
  };

  const selectedMarker = useMemo(
    () => markers.find((m) => m.id === selected) ?? null,
    [markers, selected],
  );

  const initialViewState = useMemo(() => {
    if (markers.length >= 2) {
      const lats = markers.map((m) => m.lat);
      const lngs = markers.map((m) => m.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return {
        bounds: [
          [minLng, minLat],
          [maxLng, maxLat],
        ] as [[number, number], [number, number]],
        fitBoundsOptions: { padding: 48, maxZoom: 15, duration: 0 },
      };
    }
    const first = markers[0];
    if (first) return { longitude: first.lng, latitude: first.lat, zoom };
    if (center) return { longitude: center.lng, latitude: center.lat, zoom };
    return { longitude: 3.3792, latitude: 6.5244, zoom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, zoom, center]);

  return (
    <div
      className={className}
      aria-label={ariaLabel}
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        filter: canvasFilter && canvasFilter !== 'none' ? canvasFilter : undefined,
      }}
    >
      <Map
        initialViewState={initialViewState}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        onError={handleMapError}
        onClick={onPick ? (e) => onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng }) : undefined}
        cursor={onPick ? 'crosshair' : undefined}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent?.stopPropagation?.();
              setSelected(marker.id);
              onSelect?.(marker.id);
            }}
          >
            <button
              type="button"
              aria-label={marker.title ? `Listing: ${marker.title}` : 'Listing location'}
              data-testid={`map-pin-${marker.id}`}
              data-approximate={marker.approximate ? 'true' : undefined}
              className="flex items-center gap-0.5 rounded-full px-1 py-1 shadow-md transition-transform hover:scale-110"
              style={{
                background: marker.price ? 'var(--color-bg-elevated)' : markerColor ?? 'var(--color-brand-accent)',
                color: marker.price ? 'var(--color-text-primary)' : 'var(--color-text-inverse)',
                border: `1.5px solid ${markerBorder ?? 'var(--color-brand-primary)'}`,
                cursor: 'pointer',
              }}
            >
              {marker.price ? (
                <span className="whitespace-nowrap px-1 text-[10px] font-bold">{marker.price}</span>
              ) : (
                <MapPin className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </Marker>
        ))}

        {selectedMarker && (
          <Popup
            latitude={selectedMarker.lat}
            longitude={selectedMarker.lng}
            anchor="bottom"
            offset={28}
            closeOnClick
            onClose={() => setSelected(null)}
            maxWidth="240px"
            className="hw-map-popup"
          >
            <div className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
              {selectedMarker.title && (
                <p className="font-semibold mb-1 line-clamp-2">{selectedMarker.title}</p>
              )}
              {selectedMarker.approximate && (
                <p
                  className="text-[10px] mb-1 uppercase tracking-wide"
                  style={{ color: 'var(--color-warning)' }}
                >
                  Approximate location
                </p>
              )}
              {selectedMarker.href && (
                <Link
                  href={selectedMarker.href}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: 'var(--color-brand-secondary)' }}
                >
                  View listing
                </Link>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

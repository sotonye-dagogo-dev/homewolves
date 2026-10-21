'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import HwMap from '@/components/map/hw-map';
import { useMapConfig } from '@/hooks/use-platform-config';

interface GeocodeResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface MapPinPickerProps {
  lat?: string;
  lng?: string;
  onPick: (lat: string, lng: string) => void;
  /** Initial map context (e.g. the form's address/city text) for the search box. */
  initialHint?: string;
  testId?: string;
}

/**
 * Map picker for listing creation/editing: debounced keyless geocode
 * search, click-to-set pin (crosshair), and browser geolocation. Writes
 * back through `onPick` so the owning form keeps single-source state.
 * Fails soft — search/geolocation errors show inline hints, the manual
 * lat/lng inputs remain the source of truth.
 */
export function MapPinPicker({ lat, lng, onPick, initialHint, testId }: MapPinPickerProps) {
  const { data: config } = useMapConfig();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsedLat = Number.parseFloat(lat ?? '');
  const parsedLng = Number.parseFloat(lng ?? '');
  const hasMarker =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && (parsedLat !== 0 || parsedLng !== 0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setDebounced('');
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => setDebounced(query.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    if (!debounced) return;
    let cancelled = false;
    setSearching(true);
    setSearchError(false);
    fetch(`/api/v1/maps/geocode?q=${encodeURIComponent(debounced)}&limit=5`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { results?: GeocodeResult[] }) => {
        if (!cancelled) setResults(body?.results ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setSearchError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const markers = useMemo(() => {
    if (!hasMarker) return [];
    return [
      {
        id: 'picked-location',
        lat: parsedLat,
        lng: parsedLng,
        title: 'Selected location',
      },
    ];
  }, [hasMarker, parsedLat, parsedLng]);

  const handleUseMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPick(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
      },
      () => setGeoError('Unable to retrieve your location — search or click the map instead.'),
      { timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="relative flex-1 min-w-[220px] flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={initialHint ? `Search "${initialHint}"…` : 'Search city or area…'}
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Search location"
          />
          {searching && (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--color-text-tertiary)' }} aria-hidden="true" />
          )}
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
          }}
        >
          <Crosshair className="w-3.5 h-3.5" aria-hidden="true" /> Use my location
        </button>
      </div>

      {searchError && (
        <p className="text-xs" style={{ color: 'var(--color-error)' }}>
          Location search is unavailable — set the pin by clicking the map or typing coordinates below.
        </p>
      )}
      {geoError && (
        <p className="text-xs" style={{ color: 'var(--color-error)' }}>
          {geoError}
        </p>
      )}

      {results.length > 0 && (
        <ul
          className="rounded-lg overflow-hidden divide-y"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}
          role="listbox"
          aria-label="Search results"
        >
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onPick(r.lat.toFixed(6), r.lng.toFixed(6));
                  setQuery(r.label);
                  setResults([]);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/[0.03]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-brand-accent)' }} aria-hidden="true" />
                <span className="truncate">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <HwMap
        markers={markers}
        height={260}
        center={config?.defaultCenter}
        zoom={config?.detailZoom ?? 15}
        onPick={(point) => onPick(point.lat.toFixed(6), point.lng.toFixed(6))}
        ariaLabel="Click the map to set the listing pin"
        testId={testId ?? 'map-pin-picker'}
      />

      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Click the map or search to drop the pin — the exact address stays private until a tour is booked.
      </p>
    </div>
  );
}

export default MapPinPicker;

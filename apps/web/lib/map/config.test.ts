import { describe, it, expect } from 'vitest';
import {
  buildMapStyleStack,
  buildRasterMapStyle,
  buildListingMarkers,
  locationQueryText,
  resolveListingCoords,
} from './config';

const MAP_CONFIG: MapConfig = {
  vectorStyles: {
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://tiles.openfreemap.org/styles/liberty',
  },
  rasterFallbacks: {
    light: [
      'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    dark: [
      'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
  },
  defaultCenter: { lat: 6.5244, lng: 3.3792 },
  defaultZoom: 11,
  detailZoom: 15,
  maxMarkers: 200,
  markerColor: '#C8813A',
  markerBorder: '#1A3A5C',
  geocode: { endpoint: '/api/v1/maps/geocode', limit: 5, cacheTtlSec: 300 },
  attribution: '© OpenStreetMap contributors / OpenFreeMap',
  darkCanvasFilter: 'none',
};

describe('resolveListingCoords', () => {
  it('resolves numeric latitude/longitude', () => {
    expect(resolveListingCoords({ latitude: 6.4, longitude: 3.4 })).toEqual({ lat: 6.4, lng: 3.4 });
  });

  it('resolves lat/lng aliases and string numbers', () => {
    expect(resolveListingCoords({ lat: 9.06, lng: 7.44 })).toEqual({ lat: 9.06, lng: 7.44 });
    expect(resolveListingCoords({ latitude: '6.5', longitude: '3.4' })).toBeNull();
  });

  it('rejects null location, NaN, 0,0 and out-of-range values', () => {
    expect(resolveListingCoords(null)).toBeNull();
    expect(resolveListingCoords({ latitude: NaN, longitude: 3 })).toBeNull();
    expect(resolveListingCoords({ latitude: 0, longitude: 0 })).toBeNull();
    expect(resolveListingCoords({ latitude: 95, longitude: 3 })).toBeNull();
    expect(resolveListingCoords({ latitude: 6, longitude: 404 })).toBeNull();
  });
});

describe('locationQueryText', () => {
  it('joins area, city and state and trims noise', () => {
    expect(locationQueryText({ area: ' Lekki Phase 1 ', city: 'Lagos', state: 'Lagos' })).toBe(
      'Lekki Phase 1, Lagos, Lagos',
    );
    expect(locationQueryText({ city: 'Lagos', area: null, state: 42 })).toBe('Lagos');
    expect(locationQueryText({ other: 'x' })).toBeNull();
    expect(locationQueryText(undefined)).toBeNull();
  });
});

describe('buildRasterMapStyle', () => {
  it('returns a MapLibre style object with the tile template', () => {
    const style = buildRasterMapStyle('https://tiles.example/{z}/{x}/{y}.png', '© Example');
    expect(style.version).toBe(8);
    expect((style.sources as any).basemap.tiles[0]).toBe('https://tiles.example/{z}/{x}/{y}.png');
    expect((style.layers as any)[0].source).toBe('basemap');
  });
});

describe('buildMapStyleStack', () => {
  it('leads with the vector style and appends raster fallbacks in order', () => {
    const stack = buildMapStyleStack(MAP_CONFIG, false);
    expect(stack[0]).toBe('https://tiles.openfreemap.org/styles/liberty');
    expect(stack).toHaveLength(3);
    expect((stack[1] as any).sources.basemap.tiles[0]).toContain('light_all');
    expect((stack[2] as any).sources.basemap.tiles[0]).toContain('openstreetmap');
  });

  it('uses the dark raster set when in dark theme', () => {
    const stack = buildMapStyleStack(MAP_CONFIG, true);
    expect((stack[1] as any).sources.basemap.tiles[0]).toContain('dark_all');
  });

  it('is defensive against partial config shapes', () => {
    const stack = buildMapStyleStack({}, true);
    expect(stack[0]).toContain('openfreemap.org');
    expect(stack).toHaveLength(1);
  });
});

describe('buildListingMarkers', () => {
  const listings = [
    { id: 'a', title: 'Victorian Villa', price: 85000, currency: 'NGN', locationJson: { latitude: 6.4457, longitude: 3.471 } },
    { id: 'b', title: 'Dry Flat', price: 1200000, locationJson: { latitude: 0, longitude: 0 } },
    { id: 'a', title: 'Duplicate id', locationJson: { latitude: 6.5, longitude: 3.5 } },
    { id: 'c', title: 'No coords', locationJson: { city: 'Lagos' } },
    { id: 'd', title: 'Boundary', locationJson: { lat: -90, lng: -180 } },
  ];

  it('builds pins only for listings with valid coords, de-duplicated by id', () => {
    expect(buildListingMarkers(listings as any).map((p) => p.id)).toEqual(['a', 'd']);
  });

  it('formats prices through the injected formatter', () => {
    const pins = buildListingMarkers(listings as any, {
      formatPrice: (_p, currency) => `${currency ?? 'NGN'} formatted`,
    });
    expect(pins[0]?.price).toBe('NGN formatted');
    expect(pins[0]?.href).toBe('/properties/a');
  });

  it('caps markers at the configured budget', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      id: `l${i}`,
      locationJson: { latitude: 6 + i, longitude: 3 + i },
    }));
    expect(buildListingMarkers(many, { max: 2 })).toHaveLength(2);
  });
});

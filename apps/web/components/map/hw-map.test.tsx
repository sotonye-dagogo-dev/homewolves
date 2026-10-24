import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HwMap, { MapLocationFallback } from './hw-map';
import { normalizeMapCredit } from './map-credit-tag';

// Dynamic canvas is stubbed: jsdom has no WebGL; the canvas itself is
// exercised through its own unit path (token styling) in .ctx tests.
vi.mock('next/dynamic', () => ({
  default: () =>
    function DynamicMapCanvasMock(props: Record<string, unknown>) {
      return (
        <div
          data-testid="map-canvas-mock"
          data-marker-count={String((props.markers as unknown[] | undefined)?.length ?? 0)}
          data-height={String(props.height)}
        />
      );
    },
}));

vi.mock('@/hooks/use-platform-config', () => ({
  useMapConfig: () => ({
    data: {
      vectorStyles: {
        light: 'https://tiles.openfreemap.org/styles/liberty',
        dark: 'https://tiles.openfreemap.org/styles/liberty',
      },
      rasterFallbacks: { light: [], dark: [] },
      defaultCenter: { lat: 6.5244, lng: 3.3792 },
      defaultZoom: 11,
      detailZoom: 15,
      maxMarkers: 200,
      markerColor: '#C8813A',
      markerBorder: '#1A3A5C',
      geocode: { endpoint: '/api/v1/maps/geocode', limit: 5, cacheTtlSeconds: 300 },
      attribution: '© OpenStreetMap contributors',
      darkCanvasFilter: 'none',
      credit: { enabled: true, label: 'Powered by Along', href: 'https://alongng.com' },
    },
  }),
  useFeatureFlag: () => ({ enabled: true, loading: false, source: 'fallback' }),
}));

describe('HwMap', () => {
  it('renders the styled location fallback when there are no markers', () => {
    render(
      <HwMap
        markers={[]}
        fallback={{ title: 'Exact location not available', description: 'Victoria Island, Lagos' }}
      />,
    );
    expect(screen.getByTestId('map-fallback')).toBeInTheDocument();
    expect(screen.getByText('Exact location not available')).toBeInTheDocument();
    expect(screen.getByText('Victoria Island, Lagos')).toBeInTheDocument();
  });

  it('renders the canvas when markers exist', () => {
    render(
      <HwMap
        markers={[{ id: 'listing-1', lat: 6.5, lng: 3.4, title: 'Villa', price: 'NGN 85000' }]}
      />,
    );
    expect(screen.getByTestId('map-canvas-mock')).toBeInTheDocument();
    expect(screen.getByTestId('map-canvas-mock').dataset.markerCount).toBe('1');
  });

  it('shows the config-driven credit tag on the canvas surface', () => {
    render(
      <HwMap
        markers={[{ id: 'listing-1', lat: 6.5, lng: 3.4, title: 'Villa', price: 'NGN 85000' }]}
      />,
    );
    const credit = screen.getByTestId('map-credit-tag');
    expect(credit).toBeInTheDocument();
    expect(credit.getAttribute('href')).toBe('https://alongng.com');
    expect(credit.style.color).toBe('var(--color-success)');
    expect(screen.getByText('Powered by Along')).toBeInTheDocument();
  });

  it('shows the credit tag on the fallback card too', () => {
    render(
      <HwMap
        markers={[]}
        fallback={{ title: 'Exact location not available', description: 'Victoria Island, Lagos' }}
      />,
    );
    expect(screen.getByTestId('map-credit-tag').getAttribute('href')).toBe('https://alongng.com');
  });

  it('passes the height through to the canvas', () => {
    render(
      <HwMap markers={[{ id: 'a', lat: 6.5, lng: 3.4 }]} height={412} />,
    );
    expect(screen.getByTestId('map-canvas-mock').dataset.height).toBe('412');
  });
});

describe('MapLocationFallback', () => {
  it('encodes the description into an OpenStreetMap search link', () => {    render(<MapLocationFallback title="No exact pin" description="Epe, Lagos" />);
    const link = screen.getByRole('link', { name: /Open in OpenStreetMap/ });
    expect(link.getAttribute('href')).toBe(
      `https://www.openstreetmap.org/search?query=${encodeURIComponent('Epe, Lagos')}`,
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('respects an explicit href', () => {
    render(<MapLocationFallback title="Map" href="/somewhere" hrefLabel="Directions" />);
    expect(screen.getByRole('link', { name: /Directions/ }).getAttribute('href')).toBe('/somewhere');
    expect(screen.getByText('Directions')).toBeInTheDocument();
  });

  it('omits the location link without a description or href (credit tag still present)', () => {
    render(<MapLocationFallback title="Map" />);
    expect(screen.queryByRole('link', { name: /Open in OpenStreetMap/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('map-credit-tag')).toBeInTheDocument();
  });
});

describe('normalizeMapCredit', () => {
  it('falls back to the Along defaults when the config omits credit', () => {
    expect(normalizeMapCredit(null)).toEqual({
      enabled: true,
      label: 'Powered by Along',
      href: 'https://alongng.com',
    });
  });

  it('merges partial admin fields over the defaults', () => {
    expect(normalizeMapCredit({ label: 'Routes by Along' })).toEqual({
      enabled: true,
      label: 'Routes by Along',
      href: 'https://alongng.com',
    });
  });

  it('returns null when disabled by config', () => {
    expect(normalizeMapCredit({ enabled: false })).toBeNull();
  });

  it('rejects malformed labels and non-http hrefs', () => {
    expect(normalizeMapCredit({ label: '   ' })).toBeNull();
    expect(normalizeMapCredit({ href: 'javascript:alert(1)' })).toBeNull();
    expect(normalizeMapCredit({ enabled: 'yes' as unknown as boolean })).toBeNull();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HwMap, { MapLocationFallback } from './hw-map';

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

  it('passes the height through to the canvas', () => {
    render(
      <HwMap markers={[{ id: 'a', lat: 6.5, lng: 3.4 }]} height={412} />,
    );
    expect(screen.getByTestId('map-canvas-mock').dataset.height).toBe('412');
  });
});

describe('MapLocationFallback', () => {
  it('encodes the description into an OpenStreetMap search link', () => {
    render(<MapLocationFallback title="No exact pin" description="Epe, Lagos" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe(
      `https://www.openstreetmap.org/search?query=${encodeURIComponent('Epe, Lagos')}`,
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('respects an explicit href', () => {
    render(<MapLocationFallback title="Map" href="/somewhere" hrefLabel="Directions" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/somewhere');
    expect(screen.getByText('Directions')).toBeInTheDocument();
  });

  it('omits the link without a description or href', () => {
    render(<MapLocationFallback title="Map" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

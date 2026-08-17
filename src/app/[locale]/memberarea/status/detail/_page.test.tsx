import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import messages from '@/locales/en.json';

import type { LocationRequest } from './_page';

/*
 * Google's map, substituted at the module seam the screen reaches it through. The
 * real one fetches Maps JavaScript over the network and then draws to a canvas,
 * neither of which exists here — and neither of which is what this screen is
 * responsible for. What it is responsible for is *where* the pin goes, so the
 * substitute publishes the coordinates it is handed and nothing else.
 */
type LatLng = { lat: number; lng: number };

vi.doMock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children?: ReactNode }) => children,
  Map: ({ children, defaultCenter }: { children?: ReactNode; defaultCenter: LatLng }) => (
    <div data-testid="map" data-center={`${defaultCenter.lat},${defaultCenter.lng}`}>
      {children}
    </div>
  ),
  Marker: ({ position }: { position: LatLng }) => (
    <div data-testid="pin" data-position={`${position.lat},${position.lng}`} />
  ),
}));

/** Imported after the map is in place, because the screen pulls it in at module scope. */
const { DetailStatusClientPage } = await import('./_page');

const CAPTURED = { capturedLatitude: 40.7128, capturedLongitude: -74.006 };
const ADDRESS = '285 Fulton St, New York, NY 10007, USA';

/** An answered request, of the shape `GET /api/v1/location-requests/{id}` answers with. */
const answered = (identity: Partial<LocationRequest>): LocationRequest => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'FIND_BY_LINK',
  status: 'LOCATED',
  shareLink: 'https://app.example.com/l/6f1ed002ab5595859014ebf0951522d9515002f7f5c9',
  resolvedAddress: ADDRESS,
  updatedAt: '2026-08-17T12:00:00.000Z',
  ...CAPTURED,
  ...identity,
});

const openDetail = (locationRequest: LocationRequest) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <DetailStatusClientPage locationRequest={locationRequest} />
    </NextIntlClientProvider>,
  );

describe('seeing a captured location', () => {
  it('pins the captured position and names the address beside it', () => {
    openDetail(answered({ linkName: 'Find my sister' }));

    expect(screen.getByTestId('pin')).toHaveAttribute('data-position', '40.7128,-74.006');
    expect(screen.getByTestId('map')).toHaveAttribute('data-center', '40.7128,-74.006');
    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
  });

  it('identifies a link-type request by the name the member gave it', () => {
    openDetail(answered({ type: 'FIND_BY_LINK', linkName: 'Find my sister', phoneNumber: null }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Link for Find my sister');
  });

  it('identifies a number-type request by its phone number, formatted', () => {
    openDetail(answered({ type: 'FIND_BY_NUMBER', linkName: null, phoneNumber: '+12025550123' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('+1 202 555 0123');
  });

  it('pins a position on the prime meridian, which a truthiness check would drop', () => {
    openDetail(answered({ linkName: 'Find my sister', capturedLatitude: 51.4779, capturedLongitude: 0 }));

    expect(screen.getByTestId('pin')).toHaveAttribute('data-position', '51.4779,0');
  });

  it('draws no map at all when the request carries no captured position', () => {
    openDetail(answered({ linkName: 'Find my sister', capturedLatitude: null, capturedLongitude: null }));

    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
  });
});

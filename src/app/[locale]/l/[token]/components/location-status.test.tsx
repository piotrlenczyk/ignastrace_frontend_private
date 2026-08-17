import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/locales/en.json';
import { API_PROXY_BASE_PATH } from '@/network/api/api-proxy-path';

/*
 * A relative URL resolves against the document in a browser. jsdom implements no
 * fetch, so these tests are handed Node's `Request` instead, and that one rejects
 * a relative URL outright — which is a property of the test environment and not
 * of the client. Resolving it here is what puts the browser's behaviour back.
 */
const NodeRequest = globalThis.Request;

vi.stubGlobal(
  'Request',
  class extends NodeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, window.location.origin) : input, init);
    }
  },
);

/*
 * The network, substituted once and for the whole file: the generated client
 * captures `globalThis.fetch` — and `globalThis.Request` — when it is created,
 * and the mutation hooks pull that client in transitively, so both substitutes
 * have to be in place before the component under test is imported. Both writes
 * answer 204 with no content, which is what the API answers them with.
 */
const sentRequests: Request[] = [];

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return new Response(null, { status: 204 });
});

/*
 * The geocoding module, substituted for the same reason and at the same seam the
 * component itself reaches it through: it loads Google's Maps API over the
 * network, which is neither available here nor the thing being tested. What is
 * being tested is that an address it refuses to resolve is never sent.
 */
const reverseGeo = vi.fn<(latitude: number, longitude: number) => Promise<string>>();

vi.doMock('@/libs/reverse-geocoding', () => ({ reverseGeo }));

/** Imported after the network and the geocoder are in place, for the reason above. */
const { LocationStatus } = await import('./location-status');

/** An opaque Consent link token, of the shape the API issues. */
const TOKEN = '6f1ed002ab5595859014ebf0951522d9515002f7f5c9';

/** Where the two writes are answered from: this origin, under the proxy's mount. */
const CONSENT_URL = `${window.location.origin}${API_PROXY_BASE_PATH}/api/v1/consent-links/${TOKEN}`;

const COORDINATES = { latitude: 40.7128, longitude: -74.006 };
const ADDRESS = 'New York, NY, USA';

type Geolocate = (success: PositionCallback, failure: PositionErrorCallback) => void;

/** The browser's geolocation, which jsdom implements not at all. */
const withGeolocation = (getCurrentPosition: Geolocate) =>
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });

const permissionGranted: Geolocate = (success) => success({ coords: COORDINATES } as GeolocationPosition);
const permissionDenied: Geolocate = (_success, failure) => failure({} as GeolocationPositionError);

/**
 * The prompt, mounted the way the page mounts it and given long enough for the
 * browser's answer and the geocoder's to both come back — a state settling in
 * `act` is what keeps React's own warnings out of the console, which this suite
 * fails on.
 */
const openPrompt = async (linkName?: string | null) => {
  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
          <LocationStatus token={TOKEN} linkName={linkName} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
};

/** The one request that left, or a failure saying none did. */
const sentRequest = async () => {
  await waitFor(() => expect(sentRequests).toHaveLength(1));

  const [request] = sentRequests;

  if (!request) {
    throw new Error('No request was sent.');
  }

  return request;
};

beforeEach(() => {
  sentRequests.length = 0;
  reverseGeo.mockReset();
  reverseGeo.mockResolvedValue(ADDRESS);
  document.documentElement.lang = 'en';
});

afterEach(() => {
  // @ts-expect-error the substitute is an own property, so removing it restores jsdom's silence
  delete navigator.geolocation;
});

describe('answering a Consent link', () => {
  it('grants the location the browser gave, with the address resolved here', async () => {
    withGeolocation(permissionGranted);

    await openPrompt();

    const request = await sentRequest();

    expect(request.url).toBe(`${CONSENT_URL}/grant`);
    expect(request.method).toBe('POST');
    await expect(request.json()).resolves.toEqual({ ...COORDINATES, address: ADDRESS });
    expect(reverseGeo).toHaveBeenCalledWith(COORDINATES.latitude, COORDINATES.longitude);
  });

  it('declines when the recipient refuses the browser’s permission', async () => {
    withGeolocation(permissionDenied);

    await openPrompt();

    const request = await sentRequest();

    expect(request.url).toBe(`${CONSENT_URL}/decline`);
    expect(request.method).toBe('POST');
    await expect(request.text()).resolves.toBe('');
  });

  it('sends nothing at all from a browser without geolocation', async () => {
    await openPrompt();

    expect(await screen.findByText(messages.pages.locate.not_supported)).toBeInTheDocument();
    expect(sentRequests).toHaveLength(0);
  });

  it('sends nothing at all when the address will not resolve, because a grant without one is not representable', async () => {
    withGeolocation(permissionGranted);
    reverseGeo.mockRejectedValue(new Error('No results found'));

    await openPrompt();

    expect(await screen.findByText(messages.pages.locate.error)).toBeInTheDocument();
    expect(sentRequests).toHaveLength(0);
  });

  it('shows the name the sender gave a link-type request', async () => {
    withGeolocation(permissionGranted);

    await openPrompt('Find my sister');

    expect(await screen.findByText('Find my sister')).toBeInTheDocument();
  });
});

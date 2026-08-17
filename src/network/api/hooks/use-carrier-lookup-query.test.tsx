import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_PROXY_BASE_PATH } from '../api-proxy-path';

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
 * and the hook pulls that client in transitively, so both substitutes have to be
 * in place before the module under test is imported.
 */
const sentRequests: Request[] = [];
const LOOKUP = { carrier: 'AT&T', lineType: 'mobile' } as const;

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return Response.json(LOOKUP);
});

/** Imported after the network is in place, for the reason above. */
const { useCarrierLookupQuery } = await import('./use-carrier-lookup-query');

/** Where the lookup is answered from: this origin, under the proxy's mount. */
const LOOKUP_URL = `${window.location.origin}${API_PROXY_BASE_PATH}/api/v1/carrier-lookup`;

const PHONE_NUMBER = '+12025550123';

/** The one request the hook made, or a failure saying it made none. */
const sentRequest = () => {
  const [request] = sentRequests;

  if (!request) {
    throw new Error('No request was sent.');
  }

  return request;
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  sentRequests.length = 0;
  document.documentElement.lang = 'en';
});

describe('the carrier lookup', () => {
  it('sends the phone number to the lookup path, under the proxy’s mount', async () => {
    const { result } = renderHook(() => useCarrierLookupQuery(PHONE_NUMBER), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(LOOKUP_URL);
    expect(sentRequest().method).toBe('POST');
    await expect(sentRequest().json()).resolves.toEqual({ phoneNumber: PHONE_NUMBER });
    expect(result.current.data).toEqual(LOOKUP);
  });

  it('sends nothing at all for a number that cannot be parsed', async () => {
    renderHook(() => useCarrierLookupQuery('not a phone number'), { wrapper });

    /*
     * A request the hook was going to make it makes on mount, so a turn of the
     * event loop is long enough for one to show up if the guard is gone. The
     * case above is the control: the same wrapper does send for a real number.
     */
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sentRequests).toHaveLength(0);
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
 * and the hook pulls that client in transitively, so both substitutes have to be
 * in place before the module under test is imported.
 */
const sentRequests: Request[] = [];

const report = (socialMediaState: string) => ({
  reportStatus: 'COMPLETED',
  photos: [],
  profile: { lineType: 'MOBILE', carrier: 'AT&T' },
  owners: [],
  socialMedia: { state: socialMediaState, accounts: [] },
  dataBreach: { state: 'NO_RESULTS' },
  sexOffenders: { state: 'NO_RESULTS' },
});

let respond: () => Promise<Response> = async () => Response.json(report('PENDING'));

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return respond();
});

/** Imported after the network is in place, for the reason above. */
const { SECTIONED_REPORT_POLL_INTERVAL_MS, useSectionedReportQuery } = await import('./use-sectioned-report-query');

const REPORT_ID = '3f9a1c22-9a1d-4d0e-8f6a-2c6d9a1b4e77';

/** Where the sections are read: this origin, under the proxy's mount. */
const SECTIONS_URL = `${window.location.origin}${API_PROXY_BASE_PATH}/api/v1/reverse-lookup-reports/${REPORT_ID}/sections`;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const poll = () => renderHook(() => useSectionedReportQuery(REPORT_ID, { enabled: true }), { wrapper });

beforeEach(() => {
  sentRequests.length = 0;
  respond = async () => Response.json(report('PENDING'));
  document.documentElement.lang = 'en';
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('polling a report’s sections while its social search runs', () => {
  it('reads the sections on the generated path, under the proxy’s mount', async () => {
    const { result } = poll();

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(sentRequests[0]?.url).toBe(SECTIONS_URL);
    expect(sentRequests[0]?.method).toBe('GET');
  });

  it('carries no credential of its own — the proxy attaches the bearer', async () => {
    const { result } = poll();

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(sentRequests[0]?.headers.has('authorization')).toBe(false);
  });

  it('keeps polling while the social-media section is still running', async () => {
    const { result } = poll();

    await waitFor(() => expect(result.current.data).toBeDefined());

    await vi.advanceTimersByTimeAsync(SECTIONED_REPORT_POLL_INTERVAL_MS * 3);

    expect(sentRequests.length).toBeGreaterThan(1);
  });

  it('stops polling once the social-media section is no longer running', async () => {
    respond = async () => Response.json(report('RESULTS'));

    const { result } = poll();

    await waitFor(() => expect(result.current.data).toBeDefined());

    const afterFirstRead = sentRequests.length;

    await vi.advanceTimersByTimeAsync(SECTIONED_REPORT_POLL_INTERVAL_MS * 3);

    expect(sentRequests).toHaveLength(afterFirstRead);
  });

  it('reads nothing at all until the section says the search is running', async () => {
    renderHook(() => useSectionedReportQuery(REPORT_ID, { enabled: false }), { wrapper });

    await vi.advanceTimersByTimeAsync(SECTIONED_REPORT_POLL_INTERVAL_MS * 3);

    expect(sentRequests).toHaveLength(0);
  });
});

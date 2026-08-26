import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
 * in place before the module under test is imported. Each test swaps what the
 * answer is instead of swapping the function.
 */
const sentRequests: Request[] = [];
const REPORT = { id: 'e1a5a0b6-2d84-4f2e-9f28-1c4a1f0d6f11', status: 'PENDING', lineType: 'MOBILE', carrier: 'AT&T' };

let respond: () => Promise<Response> = async () => Response.json(REPORT, { status: 201 });

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return respond();
});

/** Imported after the network is in place, for the reason above. */
const { useCreateReverseLookupMutation } = await import('./use-create-reverse-lookup-mutation');

/** Where a report is created: this origin, under the proxy's mount. */
const CREATION_URL = `${window.location.origin}${API_PROXY_BASE_PATH}/api/v1/reverse-lookup-reports`;

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
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

/**
 * The hook driven the way the form drives it: one submission, waited out through
 * the callbacks it promises a caller rather than through react-query's own state.
 */
const createReport = async () => {
  const onSuccess = vi.fn();
  const onError = vi.fn();

  const { result } = renderHook(() => useCreateReverseLookupMutation({ onSuccess, onError }), { wrapper });

  result.current.mutate(PHONE_NUMBER);

  await waitFor(() => expect(onSuccess.mock.calls.length + onError.mock.calls.length).toBe(1));

  return { onSuccess, onError };
};

beforeEach(() => {
  sentRequests.length = 0;
  respond = async () => Response.json(REPORT, { status: 201 });
  document.documentElement.lang = 'en';
});

describe('creating a reverse-lookup report', () => {
  it('posts the number to the report-creation path, under the proxy’s mount', async () => {
    await createReport();

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(CREATION_URL);
    expect(sentRequest().method).toBe('POST');
  });

  it('carries the number under the key the new API names it by', async () => {
    await createReport();

    await expect(sentRequest().json()).resolves.toEqual({ phoneNumber: PHONE_NUMBER });
  });

  it('carries no credential of its own — the proxy attaches the bearer', async () => {
    await createReport();

    expect(sentRequest().headers.has('authorization')).toBe(false);
  });

  it('hands the caller the new report’s identifier and nothing else', async () => {
    const { onSuccess } = await createReport();

    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(REPORT.id);
  });

  it('hands a refusal to the caller as the envelope the API refused in', async () => {
    const error = { message: 'Too many reports.', errorCode: 'TOO_MANY_REQUESTS_ERROR', code: 'TOO_MANY_REQUESTS' };

    respond = async () => Response.json({ error }, { status: 429 });

    const { onSuccess, onError } = await createReport();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledExactlyOnceWith({ error });
  });
});

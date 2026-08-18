import { readFileSync } from 'node:fs';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PAYMENTS_API_PROXY_BASE_PATH } from './payments-api-proxy-path';

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
 * The network, substituted once and for the whole file rather than per test: the
 * generated client captures `globalThis.fetch` — and `globalThis.Request` — when
 * it is created, so a stub installed later would never be the one it uses. Each
 * test swaps what the answer is instead of swapping the function.
 */
const sentRequests: Request[] = [];
let respond: (request: Request) => Promise<Response> = async () => Response.json([]);

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return respond(request);
});

/** Imported after the network is in place, for the reason above. */
const { $paymentsApi: paymentsQueries } = await import('./payments-api-browser-client');

const PRODUCTS_PATH = '/products';
const CANCEL_PATH = '/subscriptions/cancel';

/** Where a payments path is answered from: this origin, under the payments mount. */
const PRODUCTS_URL = `${window.location.origin}${PAYMENTS_API_PROXY_BASE_PATH}${PRODUCTS_PATH}`;

const CANCELLATION = { cancellationReason: 'Too expensive' } as const;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

/** A read driven the way a screen drives it: the client, the hooks and react-query together. */
const readProducts = async () => {
  const { result } = renderHook(() => paymentsQueries.useQuery('get', PRODUCTS_PATH), { wrapper });

  await waitFor(() => expect(result.current.isPending).toBe(false));

  return result;
};

/** A write, driven the same way. */
const cancelSubscription = async () => {
  const { result } = renderHook(() => paymentsQueries.useMutation('post', CANCEL_PATH), { wrapper });

  result.current.mutate({ body: CANCELLATION });

  await waitFor(() => expect(result.current.isPending).toBe(false));

  return result;
};

/** The one request the client made, or a failure saying it made none. */
const sentRequest = () => {
  const [request] = sentRequests;

  if (!request) {
    throw new Error('No request was sent.');
  }

  return request;
};

beforeEach(() => {
  sentRequests.length = 0;
  respond = async () => Response.json([]);
  document.documentElement.lang = 'en';
});

describe('the payments browser client', () => {
  it("sends a specification path to this origin, under the payments proxy's mount", async () => {
    await readProducts();

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(PRODUCTS_URL);
    expect(sentRequest().method).toBe('GET');
  });

  it('sends the body the caller gave, as JSON', async () => {
    await cancelSubscription();

    expect(sentRequest().method).toBe('POST');
    expect(sentRequest().headers.get('content-type')).toBe('application/json');
    await expect(sentRequest().json()).resolves.toEqual(CANCELLATION);
  });

  it('carries no credential of its own — the proxy attaches the session cookie', async () => {
    await readProducts();

    expect(sentRequest().headers.has('authorization')).toBe(false);
    expect(sentRequest().headers.has('cookie')).toBe(false);
  });

  /*
   * The API's browser client states the document's language because its own
   * server client asks next-intl for one. The payments service publishes no
   * locale parameter and the payments server client states none, so a browser
   * that stated one would make the same call differ by where it was made.
   */
  it('states no language, as the payments server client states none', async () => {
    document.documentElement.lang = 'es';

    await readProducts();

    expect(sentRequest().headers.has('x-locale')).toBe(false);
  });
});

describe('a call through the payments query hooks', () => {
  it('reads back the body the service sent', async () => {
    const products = [{ id: 'plan-monthly' }];

    respond = async () => Response.json(products);

    const result = await readProducts();

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(products);
  });

  it('fails with the envelope the payments service refuses in', async () => {
    const refusal = { message: 'Subscription already cancelled.', statusCode: 409 };

    respond = async () => Response.json(refusal, { status: 409 });

    const result = await cancelSubscription();

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(refusal);
  });
});

describe('the payments client and the API client', () => {
  /*
   * Type-level, and deliberately never run: what is being asserted is that the
   * compiler refuses each specification's paths on the other's client. Both
   * lines would be a build failure without the directive above them, which is
   * what `@ts-expect-error` pins — remove the separation and this file stops
   * compiling.
   */
  it('cannot be handed the other specification’s paths', async () => {
    const { $api } = await import('../api/api-browser-client');

    const paymentsOnTheApiClient = () =>
      // @ts-expect-error `/products` is a Payments API path; the API client cannot serve it.
      $api.queryOptions('get', PRODUCTS_PATH);

    const apiOnThePaymentsClient = () =>
      // @ts-expect-error `/api/v1/support/contact-us` is an API path; the payments client cannot serve it.
      paymentsQueries.queryOptions('get', '/api/v1/support/contact-us');

    expect([paymentsOnTheApiClient, apiOnThePaymentsClient]).toHaveLength(2);
  });

  /*
   * What a page script pulls in when it imports this module, checked as source
   * rather than as behaviour: an import of the server client — or of anything
   * reaching `next/headers`, the session or the environment — would put the
   * server's half of the application into a browser bundle, and no assertion
   * about a request would notice, because a test runs where both halves exist.
   * The API's specification is absent from the list for the same reason: the
   * two clients are separate so that neither drags the other's specification in.
   */
  it('imports nothing beyond the two libraries, its own specification and the mount', () => {
    // From the repository root: `import.meta.url` is an http URL under jsdom.
    const source = readFileSync('src/network/payments-api/payments-api-browser-client.ts', 'utf8');

    const imported = [...source.matchAll(/from '(.+)';$/gm)].map(([, specifier]) => specifier);

    expect(imported).toEqual(['openapi-fetch', 'openapi-react-query', './payments-api', './payments-api-proxy-path']);
  });
});

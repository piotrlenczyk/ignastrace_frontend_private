import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PAYMENTS_API_PROXY_BASE_PATH } from '../payments-api-proxy-path';

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
let respond: () => Promise<Response> = async () => Response.json({ status: 'active' }, { status: 201 });

vi.stubGlobal('fetch', async (request: Request) => {
  sentRequests.push(request);

  return respond();
});

/** Imported after the network is in place, for the reason above. */
const { useUpdateStripePaymentMethodMutation } = await import('./use-update-stripe-payment-method-mutation');

/** Where a card change is answered from: this origin, under the payments mount. */
const PAYMENT_METHOD_URL = `${window.location.origin}${PAYMENTS_API_PROXY_BASE_PATH}/subscriptions/stripe/payment-method`;

const PAYMENT_METHOD_ID = 'pm_1L7bEDEFZlD1Czhu55Vkrkwr';

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

beforeEach(() => {
  sentRequests.length = 0;
  respond = async () => Response.json({ status: 'active' }, { status: 201 });
});

describe('the Stripe payment-method update', () => {
  it('sends the payment method to the payments path, under the proxy’s mount', async () => {
    const { result } = renderHook(() => useUpdateStripePaymentMethodMutation(), { wrapper });

    result.current.mutate({ body: { paymentMethodId: PAYMENT_METHOD_ID } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(PAYMENT_METHOD_URL);
    expect(sentRequest().method).toBe('POST');
    await expect(sentRequest().json()).resolves.toEqual({ paymentMethodId: PAYMENT_METHOD_ID });
  });

  it('carries no credential of its own: the proxy attaches the session’s', async () => {
    const { result } = renderHook(() => useUpdateStripePaymentMethodMutation(), { wrapper });

    result.current.mutate({ body: { paymentMethodId: PAYMENT_METHOD_ID } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequest().headers.get('authorization')).toBeNull();
    expect(sentRequest().headers.get('cookie')).toBeNull();
  });

  it('hands back the confirmation the immediate charge needs, rather than a boolean', async () => {
    respond = async () =>
      Response.json(
        { status: 'incomplete', clientSecret: 'pi_123_secret_456', paymentIntentId: 'pi_123456789' },
        { status: 201 },
      );

    const { result } = renderHook(() => useUpdateStripePaymentMethodMutation(), { wrapper });

    result.current.mutate({ body: { paymentMethodId: PAYMENT_METHOD_ID } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      status: 'incomplete',
      clientSecret: 'pi_123_secret_456',
      paymentIntentId: 'pi_123456789',
    });
  });

  /*
   * The legacy predecessor answered a refusal with a 200 carrying
   * `{ success: false }`, so its caller had to inspect the body to find out. The
   * point of the move is that a refusal now arrives as one.
   */
  it('rejects with the body the payments service refused with', async () => {
    respond = async () => Response.json({ message: 'No subscription found', statusCode: 404 }, { status: 404 });

    const { result } = renderHook(() => useUpdateStripePaymentMethodMutation(), { wrapper });

    result.current.mutate({ body: { paymentMethodId: PAYMENT_METHOD_ID } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual({ message: 'No subscription found', statusCode: 404 });
  });
});

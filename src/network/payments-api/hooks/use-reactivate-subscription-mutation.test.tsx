import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PAYMENTS_API_PROXY_BASE_PATH } from '../payments-api-proxy-path';
import { answerWith, resetNetwork, sentRequest, sentRequests, wrapper } from './payments-hook-test-harness';

/** Imported after the harness has substituted the network — see the harness for why that order matters. */
const { useReactivateSubscriptionMutation } = await import('./use-reactivate-subscription-mutation');

/** Where a called-off cancellation is answered from: this origin, under the payments mount. */
const REACTIVATE_URL = `${window.location.origin}${PAYMENTS_API_PROXY_BASE_PATH}/subscriptions/reactivate`;

beforeEach(() => resetNetwork());

describe('calling off a subscription cancellation', () => {
  /*
   * The operation declares no request body and no parameters — which subscription
   * it resumes comes from the cookie the proxy attaches — so the request carries
   * nothing at all.
   */
  it('posts to the payments path, under the proxy’s mount, with nothing to say', async () => {
    const { result } = renderHook(() => useReactivateSubscriptionMutation(), { wrapper });

    result.current.mutate({});

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(REACTIVATE_URL);
    expect(sentRequest().method).toBe('POST');
    expect(sentRequest().body).toBeNull();
  });

  it('carries no credential of its own: the proxy attaches the session’s', async () => {
    const { result } = renderHook(() => useReactivateSubscriptionMutation(), { wrapper });

    result.current.mutate({});

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequest().headers.get('authorization')).toBeNull();
    expect(sentRequest().headers.get('cookie')).toBeNull();
  });

  /*
   * The screen only offers this for a subscription that is cancelled and has not
   * expired, which is exactly what this endpoint resumes. A refusal is therefore
   * not expected — and is surfaced rather than swallowed if it comes anyway.
   */
  it('rejects with the body the payments service refused with', async () => {
    answerWith(async () =>
      Response.json({ message: 'Subscription is not cancelled', statusCode: 400 }, { status: 400 }),
    );

    const { result } = renderHook(() => useReactivateSubscriptionMutation(), { wrapper });

    result.current.mutate({});

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual({ message: 'Subscription is not cancelled', statusCode: 400 });
  });
});

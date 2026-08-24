import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PAYMENTS_API_PROXY_BASE_PATH } from '../payments-api-proxy-path';
import { answerWith, resetNetwork, sentRequest, sentRequests, wrapper } from './payments-hook-test-harness';

/** Imported after the harness has substituted the network — see the harness for why that order matters. */
const { useCancelSubscriptionMutation } = await import('./use-cancel-subscription-mutation');

/** Where a cancellation is answered from: this origin, under the payments mount. */
const CANCEL_URL = `${window.location.origin}${PAYMENTS_API_PROXY_BASE_PATH}/subscriptions/cancel`;

beforeEach(() => resetNetwork());

describe('the subscription cancellation', () => {
  /*
   * The body is declared required and its only field is optional, so an empty
   * object is the whole request. It is asserted rather than assumed: dropping it
   * would send no body at all against an operation that demands one.
   */
  it('posts an empty body to the payments path, under the proxy’s mount', async () => {
    const { result } = renderHook(() => useCancelSubscriptionMutation(), { wrapper });

    result.current.mutate({ body: {} });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequests).toHaveLength(1);
    expect(sentRequest().url).toBe(CANCEL_URL);
    expect(sentRequest().method).toBe('POST');
    await expect(sentRequest().json()).resolves.toEqual({});
  });

  /*
   * `cancellationReason` is deliberately never sent from the billing screen: the
   * dialog asks for no reason, and the specification says to omit the field when
   * none was given.
   */
  it('states no cancellation reason', async () => {
    const { result } = renderHook(() => useCancelSubscriptionMutation(), { wrapper });

    result.current.mutate({ body: {} });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await expect(sentRequest().json()).resolves.not.toHaveProperty('cancellationReason');
  });

  it('carries no credential of its own: the proxy attaches the session’s', async () => {
    const { result } = renderHook(() => useCancelSubscriptionMutation(), { wrapper });

    result.current.mutate({ body: {} });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(sentRequest().headers.get('authorization')).toBeNull();
    expect(sentRequest().headers.get('cookie')).toBeNull();
  });

  /*
   * The legacy predecessor answered with a subscription this screen no longer
   * reads, and a refusal reached the caller as an `ApiError`. Here a refusal is
   * the body the service refused with, and the call site turns it into a toast.
   */
  it('rejects with the body the payments service refused with', async () => {
    answerWith(async () => Response.json({ message: 'No subscription found', statusCode: 404 }, { status: 404 }));

    const { result } = renderHook(() => useCancelSubscriptionMutation(), { wrapper });

    result.current.mutate({ body: {} });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual({ message: 'No subscription found', statusCode: 404 });
  });
});

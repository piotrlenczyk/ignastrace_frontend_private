import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { PAYMENTS_API_PROXY_BASE_PATH } from '../payments-api-proxy-path';
import { answerWith, resetNetwork, sentRequest, sentRequests, wrapper } from './payments-hook-test-harness';

/** Imported after the harness has substituted the network — see the harness for why that order matters. */
const { useUpdateStripePaymentMethodMutation } = await import('./use-update-stripe-payment-method-mutation');

/** Where a card change is answered from: this origin, under the payments mount. */
const PAYMENT_METHOD_URL = `${window.location.origin}${PAYMENTS_API_PROXY_BASE_PATH}/subscriptions/stripe/payment-method`;

const PAYMENT_METHOD_ID = 'pm_1L7bEDEFZlD1Czhu55Vkrkwr';

/** Unlike the acknowledgements the other operations answer, this one answers a subscription. */
const anActiveSubscription = async () => Response.json({ status: 'active' }, { status: 201 });

beforeEach(() => resetNetwork(anActiveSubscription));

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
    answerWith(async () =>
      Response.json(
        { status: 'incomplete', clientSecret: 'pi_123_secret_456', paymentIntentId: 'pi_123456789' },
        { status: 201 },
      ),
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
    answerWith(async () => Response.json({ message: 'No subscription found', statusCode: 404 }, { status: 404 }));

    const { result } = renderHook(() => useUpdateStripePaymentMethodMutation(), { wrapper });

    result.current.mutate({ body: { paymentMethodId: PAYMENT_METHOD_ID } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual({ message: 'No subscription found', statusCode: 404 });
  });
});

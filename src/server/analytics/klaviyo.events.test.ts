import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { OK, refusal, resetKit, serveApi } from '@/test/server-write-kit';

/*
 * The two Klaviyo events, driven the way a checkout screen drives them: a call
 * in, a request out and nothing thrown. What this seam is for is the promise the
 * four call sites depend on and cannot see from inside a render — that a report
 * nobody waits for cannot take the page down with it, whatever the API or the
 * network does.
 */
const { reportCheckoutStarted, reportOrderConfirmed } = await import('./klaviyo.events');

const CHECKOUT_STARTED_PATH = '/api/v1/klaviyo/checkout-started';
const ORDER_CONFIRMED_PATH = '/api/v1/klaviyo/order-confirmed';

beforeEach(() => {
  resetKit();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('reportCheckoutStarted', () => {
  it('posts the context it is given to the checkout-started endpoint', async () => {
    const api = serveApi({ [CHECKOUT_STARTED_PATH]: OK });

    await reportCheckoutStarted({ flow: 'reverse_lookup', product: 'reverse_lookup' });
    const upstream = api.request(CHECKOUT_STARTED_PATH);

    expect(upstream.method).toBe('POST');
    expect(await upstream.json()).toEqual({ flow: 'reverse_lookup', product: 'reverse_lookup' });
  });

  it('posts an empty event where the screen carries no flow or product context', async () => {
    const api = serveApi({ [CHECKOUT_STARTED_PATH]: OK });

    await reportCheckoutStarted();

    expect(await api.request(CHECKOUT_STARTED_PATH).json()).toEqual({});
  });

  it('swallows a refusal rather than rejecting at a caller that never awaited it', async () => {
    serveApi({ [CHECKOUT_STARTED_PATH]: { status: 401, body: refusal('UNAUTHORIZED', 'AUTH_401', 'Nope.') } });

    await expect(reportCheckoutStarted()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('swallows an unreachable API the same way', async () => {
    serveApi({});

    await expect(reportCheckoutStarted()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('reportOrderConfirmed', () => {
  it('posts to the order-confirmed endpoint', async () => {
    const api = serveApi({ [ORDER_CONFIRMED_PATH]: OK });

    await reportOrderConfirmed();
    const upstream = api.request(ORDER_CONFIRMED_PATH);

    expect(upstream.method).toBe('POST');
    expect(await upstream.json()).toEqual({});
  });

  it('swallows a refusal', async () => {
    serveApi({ [ORDER_CONFIRMED_PATH]: { status: 500, body: refusal('SERVER_ERROR', 'ERR_500', 'Nope.') } });

    await expect(reportOrderConfirmed()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});

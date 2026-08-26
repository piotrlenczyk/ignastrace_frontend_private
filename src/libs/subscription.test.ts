import type { Route } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';
/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { paymentsRefusal, redirect, REDIRECTED, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

const { getSubscriptionRedirect, redirectIfAuthenticated } = await import('./subscription');

/*
 * The subscription gate: the one function every gated screen asks where a member
 * belongs.
 *
 * Nothing of this application is substituted. The gate, the getter it reads, the
 * `hasAccess` rule that getter computes and the redirect itself are all inside
 * the test, and the only boundaries are the request's cookie jar and `fetch` —
 * which is the point. The gate's whole job is a routing decision taken from an
 * upstream answer, so a test that stood in for the answer, or for the decision,
 * could not say anything about either.
 */

const SUBSCRIPTIONS_PATH = '/subscriptions';

const IN_A_WEEK = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const A_WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

/**
 * As much of the payments service's subscription as the gate's rule reads.
 *
 * The overrides are typed against the generated shape rather than left open, so
 * that a misspelled `cancelledAt` fails the type check instead of quietly
 * describing a subscription the service could never answer with.
 */
const subscription = (overrides: Partial<paymentsSchemas['SubscriptionResponseDto']>) => ({
  id: '473ec52e-fe53-42f5-97ca-1042c945f866',
  provider: 'stripe',
  onTrial: false,
  providerSubscriptionId: 'sub_1NiybOExYvlWir54VD73AXXF',
  createdAt: A_WEEK_AGO,
  expiresAt: IN_A_WEEK,
  ...overrides,
});

const servePayments = (route: { status: number; body?: unknown }) => serveApi({ [SUBSCRIPTIONS_PATH]: route });

/** The subscription the payments service holds for this member. */
const holding = (overrides: Partial<paymentsSchemas['SubscriptionResponseDto']>) =>
  servePayments({ status: 200, body: subscription(overrides) });

/** The answer the service gives for a member it has no subscription row for. */
const holdingNothing = () =>
  servePayments({ status: 404, body: paymentsRefusal(404, 'Subscription for user not found') });

/**
 * The service refusing for a reason that is not an absence, with the incident it
 * logs captured rather than printed through the test run.
 */
const refusing = () => {
  servePayments({ status: 500, body: paymentsRefusal(500, 'Internal server error') });

  return vi.spyOn(console, 'error').mockImplementation(() => {});
};

/**
 * The service not answering at all. Serving no route at all is what the kit turns
 * into a rejected request, which is the shape a transport failure arrives in —
 * an unresolvable host or a reset connection, rather than a refusal with a status
 * on it.
 */
const unreachable = () => {
  serveApi({});

  return vi.spyOn(console, 'error').mockImplementation(() => {});
};

const ROUTES = {
  noSubscription: '/checkout' as Route,
  activeSubscription: '/memberarea/status' as Route,
  endedSubscription: '/memberarea/settings/billing' as Route,
};

const routeFor = () => getSubscriptionRedirect({ routes: ROUTES });

beforeEach(async () => {
  resetKit();
  await signedIn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getSubscriptionRedirect()', () => {
  it('sends a member whose subscription never got past `initial` to the no-subscription route', async () => {
    holding({ status: 'initial' });

    await expect(routeFor()).resolves.toBe(ROUTES.noSubscription);
  });

  it('sends a member whose subscription never completed to the no-subscription route', async () => {
    holding({ status: 'incomplete' });

    await expect(routeFor()).resolves.toBe(ROUTES.noSubscription);
  });

  it('sends a member the service holds no subscription for to the no-subscription route', async () => {
    holdingNothing();

    await expect(routeFor()).resolves.toBe(ROUTES.noSubscription);
  });

  it('sends a paying member to the active route', async () => {
    holding({ status: 'active' });

    await expect(routeFor()).resolves.toBe(ROUTES.activeSubscription);
  });

  it('keeps a cancelled member on the active route until their period runs out', async () => {
    holding({ status: 'cancelled', expiresAt: IN_A_WEEK, cancelledAt: A_WEEK_AGO });

    await expect(routeFor()).resolves.toBe(ROUTES.activeSubscription);
  });

  it('sends a cancelled member past their expiry to the ended route', async () => {
    holding({ status: 'cancelled', expiresAt: A_WEEK_AGO, cancelledAt: A_WEEK_AGO });

    await expect(routeFor()).resolves.toBe(ROUTES.endedSubscription);
  });

  it('keeps a member the service is still retrying payment on the active route', async () => {
    holding({ status: 'expired', expiresAt: A_WEEK_AGO, nextPaymentAttemptAt: IN_A_WEEK });

    await expect(routeFor()).resolves.toBe(ROUTES.activeSubscription);
  });

  it('sends an expired member nobody is retrying to the ended route', async () => {
    holding({ status: 'expired', expiresAt: A_WEEK_AGO });

    await expect(routeFor()).resolves.toBe(ROUTES.endedSubscription);
  });

  it('reads the subscription from the payments service and nothing else', async () => {
    const payments = holding({ status: 'active' });

    await routeFor();

    expect(payments.paths()).toEqual([SUBSCRIPTIONS_PATH]);
  });

  it('leaves a member where they are when the payments service refuses for any other reason', async () => {
    refusing();

    await expect(routeFor()).resolves.toBeUndefined();
  });

  it('reports an unreadable subscription as an incident', async () => {
    const reported = refusing();

    await routeFor();

    expect(reported).toHaveBeenCalled();
  });

  it('leaves a member where they are when the payments service cannot be reached at all', async () => {
    const reported = unreachable();

    await expect(routeFor()).resolves.toBeUndefined();
    expect(reported).toHaveBeenCalled();
  });

  it('leaves a signed-out visitor where they are, without calling the payments service', async () => {
    resetKit();
    const payments = servePayments({ status: 200, body: subscription({ status: 'active' }) });

    await expect(routeFor()).resolves.toBeUndefined();
    expect(payments.paths()).toEqual([]);
  });

  it('leaves a member where they are when their state names no route', async () => {
    holding({ status: 'active' });

    await expect(
      getSubscriptionRedirect({ routes: { endedSubscription: ROUTES.endedSubscription } }),
    ).resolves.toBeUndefined();
  });
});

describe('redirectIfAuthenticated()', () => {
  it('redirects a member whose state names a route', async () => {
    holding({ status: 'expired', expiresAt: A_WEEK_AGO });

    await expect(redirectIfAuthenticated(ROUTES)).rejects.toThrow(REDIRECTED);

    expect(redirect).toHaveBeenCalledWith(ROUTES.endedSubscription);
  });

  it('redirects a paying member off a public screen', async () => {
    holding({ status: 'active' });

    await expect(redirectIfAuthenticated(ROUTES)).rejects.toThrow(REDIRECTED);

    expect(redirect).toHaveBeenCalledWith(ROUTES.activeSubscription);
  });

  it('redirects a member who has never paid to the no-subscription route', async () => {
    holdingNothing();

    await expect(redirectIfAuthenticated(ROUTES)).rejects.toThrow(REDIRECTED);

    expect(redirect).toHaveBeenCalledWith(ROUTES.noSubscription);
  });

  it('leaves a member with no subscription on the public screen they are reading', async () => {
    holdingNothing();

    await redirectIfAuthenticated({ endedSubscription: ROUTES.endedSubscription });

    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not redirect a signed-out visitor', async () => {
    resetKit();
    servePayments({ status: 200, body: subscription({ status: 'active' }) });

    await redirectIfAuthenticated(ROUTES);

    expect(redirect).not.toHaveBeenCalled();
  });
});

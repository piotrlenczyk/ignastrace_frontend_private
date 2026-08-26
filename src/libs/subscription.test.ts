import type { Route } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubscriptionStatus } from '@/types/subscription';
import type { User } from '@/types/user';

import {
  getSubscriptionRedirect,
  hasActiveSubscription,
  hasEndedSubscription,
  hasSubscription,
  redirectIfAuthenticated,
} from './subscription';

/*
 * Only the two boundaries are mocked: who the session says is here, and what the
 * account service answers. Everything between them — the composer, the three
 * predicates, the branch that picks a route — is the code under test, which is
 * the point of the shape it now has. The version this replaced had to mock five
 * exports of its own dependency to say anything at all.
 */
const { getServerSession, composeMember, redirect } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  composeMember: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/server/session/session.utils', () => ({ getServerSession }));
vi.mock('@/libs/membership-mock', () => ({ composeMember }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/network/api/apiServerClient', () => ({
  apiServerClient: { '/api/v1/user/me': { GET: vi.fn().mockResolvedValue({}) } },
}));
vi.mock('@/network/http-response-handler', () => ({
  unwrapApiResponse: <T>(response: T) => response,
}));

const memberWith = (subscription_status: SubscriptionStatus): User => ({
  id: 'member-1',
  email: 'member@example.com',
  locale: 'en',
  notify_status_changes: true,
  notify_user_located: true,
  subscription_status,
  upsellings: [],
  currency: 'usd',
  onboarding_phone_number: '+12025550143',
});

/** The visitor is signed in, and their subscription is in this state. */
const signedInWith = (status: SubscriptionStatus) => {
  getServerSession.mockResolvedValue({ isLoggedIn: true });
  composeMember.mockReturnValue(memberWith(status));
};

/** Nobody is signed in. An empty session object, because that is what a guest gets. */
const signedOut = () => {
  getServerSession.mockResolvedValue({ isLoggedIn: false });
};

const ROUTES = {
  noSubscription: '/checkout' as Route,
  activeSubscription: '/memberarea/status' as Route,
  endedSubscription: '/memberarea/settings/billing' as Route,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the subscription predicates', () => {
  it.each<[SubscriptionStatus, boolean]>([
    ['initial', false],
    ['incomplete', false],
    ['incomplete_expired', false],
    ['active', true],
    ['cancelled', true],
    ['expired', true],
  ])('hasSubscription is %s → %s', (status, expected) => {
    expect(hasSubscription(memberWith(status))).toBe(expected);
  });

  it.each<[SubscriptionStatus, boolean]>([
    ['initial', false],
    ['incomplete', false],
    ['incomplete_expired', false],
    ['active', true],
    ['cancelled', true],
    ['expired', false],
  ])('hasActiveSubscription is %s → %s', (status, expected) => {
    expect(hasActiveSubscription(memberWith(status))).toBe(expected);
  });

  it('reads only an expired subscription as ended', () => {
    expect(hasEndedSubscription(memberWith('expired'))).toBe(true);
    expect(hasEndedSubscription(memberWith('cancelled'))).toBe(false);
  });
});

describe('getSubscriptionRedirect()', () => {
  it('sends a member who has never paid to the no-subscription route', async () => {
    signedInWith('initial');

    await expect(getSubscriptionRedirect({ routes: ROUTES })).resolves.toBe(ROUTES.noSubscription);
  });

  it('sends a paying member to the active route', async () => {
    signedInWith('active');

    await expect(getSubscriptionRedirect({ routes: ROUTES })).resolves.toBe(ROUTES.activeSubscription);
  });

  it('sends a member inside a cancelled but unexpired period to the active route', async () => {
    signedInWith('cancelled');

    await expect(getSubscriptionRedirect({ routes: ROUTES })).resolves.toBe(ROUTES.activeSubscription);
  });

  it('sends an expired member to the ended route', async () => {
    signedInWith('expired');

    await expect(getSubscriptionRedirect({ routes: ROUTES })).resolves.toBe(ROUTES.endedSubscription);
  });

  it('leaves a guest where they are, without reading the account', async () => {
    signedOut();

    await expect(getSubscriptionRedirect({ routes: ROUTES })).resolves.toBeUndefined();
    expect(composeMember).not.toHaveBeenCalled();
  });

  it('leaves a member where they are when their state names no route', async () => {
    signedInWith('active');

    await expect(
      getSubscriptionRedirect({ routes: { endedSubscription: ROUTES.endedSubscription } }),
    ).resolves.toBeUndefined();
  });
});

describe('redirectIfAuthenticated()', () => {
  it('redirects a member whose state names a route', async () => {
    signedInWith('expired');

    await redirectIfAuthenticated(ROUTES);

    expect(redirect).toHaveBeenCalledWith(ROUTES.endedSubscription);
  });

  it('does not redirect a guest', async () => {
    signedOut();

    await redirectIfAuthenticated(ROUTES);

    expect(redirect).not.toHaveBeenCalled();
  });
});

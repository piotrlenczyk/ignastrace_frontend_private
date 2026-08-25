import { getUserForPoliciesCheck, hasActiveSubscription, hasSubscription } from '@/libs/subscription';

import { getSubscriptionRedirect } from './get-subscription-redirect';

vi.mock('next/server', () => ({}));

/*
 * Mirrors the real export list of @/libs/subscription. The factory replaces the
 * module wholesale, so an export missing here is a throw at call time rather
 * than an undefined — which is how this file came to be red: it mocked
 * `hasAnySubscription` and `hasEndedSubscription`, which the module does not
 * export, and left out `getUserForPoliciesCheck`, which it does and which
 * getSubscriptionRedirect calls first.
 */
vi.mock('@/libs/subscription', () => ({
  getUser: vi.fn(),
  getUserForPoliciesCheck: vi.fn(),
  hasSubscription: vi.fn(),
  hasActiveSubscription: vi.fn(),
  hasEndedSubscription: vi.fn(),
}));

const dummyRoutes = {
  noSubscription: 'noSubscriptionURL',
  hasSubscription: 'hasSubscriptionURL',
  activeSubscription: 'activeSubscriptionURL',
  endedSubscription: 'endedSubscriptionURL',
};

type SubscriptionType = 'NO_SUBSCRIPTION' | 'ACTIVE_SUBSCRIPTION' | 'ENDED_SUBSCRIPTION';

const setUpUser = (subscriptionType: SubscriptionType) => {
  vi.resetAllMocks();

  vi.mocked(getUserForPoliciesCheck).mockResolvedValue({} as Awaited<ReturnType<typeof getUserForPoliciesCheck>>);

  const setPolicies = (subscription: boolean, active: boolean) => {
    vi.mocked(hasSubscription).mockResolvedValue(subscription);
    vi.mocked(hasActiveSubscription).mockResolvedValue(active);
  };

  switch (subscriptionType) {
    case 'NO_SUBSCRIPTION':
      setPolicies(false, false);
      return;

    case 'ACTIVE_SUBSCRIPTION':
      setPolicies(true, true);
      return;

    case 'ENDED_SUBSCRIPTION':
      setPolicies(true, false);
      return;

    default:
      throw new Error('invalid subscription type');
  }
};

describe('getSubscriptionRedirect()', () => {
  describe('a user with NO subscription', () => {
    it('gets noSubscription route', async () => {
      setUpUser('NO_SUBSCRIPTION');

      const output = await getSubscriptionRedirect({ routes: dummyRoutes });

      expect(output).toBe(dummyRoutes.noSubscription);
    });
  });

  describe('a user with NON ACTIVE subscription', () => {
    it('gets endedSubscription route', async () => {
      setUpUser('ENDED_SUBSCRIPTION');

      const output = await getSubscriptionRedirect({ routes: dummyRoutes });

      expect(output).toBe(dummyRoutes.endedSubscription);
    });
  });

  describe('a user with ACTIVE subscription', () => {
    it('gets activeSubscription route', async () => {
      setUpUser('ACTIVE_SUBSCRIPTION');

      const output = await getSubscriptionRedirect({ routes: dummyRoutes });

      // `activeSubscription` is tried before `hasSubscription`, and both are
      // set here — so this is the route the case is named after.
      expect(output).toBe(dummyRoutes.activeSubscription);
    });
  });
});

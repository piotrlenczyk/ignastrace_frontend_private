import { getUserForPoliciesCheck, hasActiveSubscription, hasSubscription, hasUpsellings } from '@/libs/subscription';

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
  hasUpsellings: vi.fn(),
}));

const dummyRoutes = {
  noSubscription: 'noSubscriptionURL',
  hasSubscription: 'hasSubscriptionURL',
  activeSubscription: 'activeSubscriptionURL',
  endedSubscription: 'endedSubscriptionURL',
  hasUpsellings: 'hasUpsellingsURL',
};

type SubscriptionType =
  'NO_SUBSCRIPTION' | 'ACTIVE_SUBSCRIPTION' | 'ENDED_SUBSCRIPTION' | 'HAS_UPSELLINGS' | 'HAS_NO_UPSELLINGS';

const setUpUser = (subscriptionType: SubscriptionType) => {
  vi.resetAllMocks();

  vi.mocked(getUserForPoliciesCheck).mockResolvedValue({} as Awaited<ReturnType<typeof getUserForPoliciesCheck>>);

  const setPolicies = (subscription: boolean, active: boolean, upsellings: boolean) => {
    vi.mocked(hasSubscription).mockResolvedValue(subscription);
    vi.mocked(hasActiveSubscription).mockResolvedValue(active);
    vi.mocked(hasUpsellings).mockResolvedValue(upsellings);
  };

  switch (subscriptionType) {
    case 'NO_SUBSCRIPTION':
      setPolicies(false, false, false);
      return;

    case 'ACTIVE_SUBSCRIPTION':
      setPolicies(true, true, false);
      return;

    case 'ENDED_SUBSCRIPTION':
      setPolicies(true, false, false);
      return;

    case 'HAS_NO_UPSELLINGS':
      setPolicies(true, true, false);
      return;

    case 'HAS_UPSELLINGS':
      setPolicies(true, true, true);
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
    describe('if HAS upsellings', () => {
      it('gets hasUpsellings route', async () => {
        setUpUser('HAS_UPSELLINGS');

        const output = await getSubscriptionRedirect({ routes: dummyRoutes });

        expect(output).toBe(dummyRoutes.hasUpsellings);
      });
    });

    describe('if does NOT have upsellings', () => {
      it('gets activeSubscription route', async () => {
        setUpUser('HAS_NO_UPSELLINGS');

        const output = await getSubscriptionRedirect({ routes: dummyRoutes });

        // `activeSubscription` is tried before `hasSubscription`, and both are
        // set here — so this is the route the case is named after. The previous
        // assertion named the other one; it never ran, because the mock above
        // was throwing before any of these reached an expectation.
        expect(output).toBe(dummyRoutes.activeSubscription);
      });
    });
  });
});

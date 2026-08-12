import { hasActiveSubscription, hasSubscription, hasUpsellings } from '@/libs/subscription';

import { getSubscriptionRedirect } from './get-subscription-redirect';

vi.mock('next/server', () => ({}));

vi.mock('@/libs/subscription', () => ({
  hasSubscription: vi.fn(),
  hasAnySubscription: vi.fn(),
  hasActiveSubscription: vi.fn(),
  hasUpsellings: vi.fn(),
  hasEndedSubscription: vi.fn(),
}));

const dummyRoutes = {
  noSubscription: 'noSubscriptionURL',
  hasSubscription: 'hasSubscriptionURL',
  activeSubscription: 'activeSubscriptionURL',
  endedSubscription: 'endedSubscriptionURL',
  hasUpsellings: 'hasUpsellingsURL',
};

type SubscriptionType = 'NO_SUBSCRIPTION' | 'ACTIVE_SUBSCRIPTION' |
  'ENDED_SUBSCRIPTION' | 'HAS_UPSELLINGS' | 'HAS_NO_UPSELLINGS';

const setUpUser = (subscriptionType: SubscriptionType) => {
  vi.resetAllMocks();

  switch (subscriptionType) {
    case 'NO_SUBSCRIPTION':
      hasSubscription.mockReturnValue(false);
      hasActiveSubscription.mockReturnValue(false);
      hasUpsellings.mockReturnValue(false);
      return;

    case 'ACTIVE_SUBSCRIPTION':
      hasSubscription.mockReturnValue(true);
      hasActiveSubscription.mockReturnValue(true);
      hasUpsellings.mockReturnValue(false);
      return;

    case 'ENDED_SUBSCRIPTION':
      hasSubscription.mockReturnValue(true);
      hasActiveSubscription.mockReturnValue(false);
      hasUpsellings.mockReturnValue(false);
      return;

    case 'HAS_NO_UPSELLINGS':
      hasSubscription.mockReturnValue(true);
      hasActiveSubscription.mockReturnValue(true);
      hasUpsellings.mockReturnValue(false);
      return;

    case 'HAS_UPSELLINGS':
      hasSubscription.mockReturnValue(true);
      hasActiveSubscription.mockReturnValue(true);
      hasUpsellings.mockReturnValue(true);
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

        expect(output).toBe(dummyRoutes.hasSubscription);
      });
    });
  });
});

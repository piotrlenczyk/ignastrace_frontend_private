import type { Route } from 'next';

import { getUserForPoliciesCheck, hasActiveSubscription, hasSubscription, hasUpsellings } from '@/libs/subscription';

export const getSubscriptionRedirect = async ({
  allowUnauthenticated = false,
  routes,
}: {
  allowUnauthenticated?: boolean;
  routes: Partial<{
    noSubscription: Route;
    hasSubscription: Route;
    activeSubscription: Route;
    endedSubscription: Route;
    hasUpsellings: Route;
  }>;
}): Promise<Route | undefined> => {
  try {
    const user = await getUserForPoliciesCheck({ allowUnauthenticated });

    if (allowUnauthenticated && !user) {
      return undefined;
    }

    const [hasAnySubscription, subscriptionIsActive, userHasUpsellings] = await Promise.all([
      hasSubscription({ user, allowUnauthenticated }),
      hasActiveSubscription({ user, allowUnauthenticated }),
      hasUpsellings({ user, allowUnauthenticated }),
    ]);

    if (!hasAnySubscription) {
      if (!routes.noSubscription) {
        return undefined;
      }
      return routes.noSubscription;
    }

    if (userHasUpsellings && routes.hasUpsellings) {
      return routes.hasUpsellings;
    }

    if (subscriptionIsActive) {
      if (routes.activeSubscription) {
        return routes.activeSubscription;
      }
      if (routes.hasSubscription) {
        return routes.hasSubscription;
      }
      return undefined;
    }

    if (routes.endedSubscription) {
      return routes.endedSubscription;
    }

    return undefined;
  } catch (error) {
    console.error('Failed to determine subscription status:', error);
    throw error;
  }
};

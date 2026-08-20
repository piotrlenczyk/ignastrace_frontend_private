import type { Route } from 'next';
import { redirect } from 'next/navigation';

import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getServerSession } from '@/server/session/session.utils';

export const redirectIfAuthenticated = async ({
  activeSubscriptionRoute,
  endedSubscriptionRoute,
  noSubscriptionRoute,
}: {
  activeSubscriptionRoute?: Route;
  endedSubscriptionRoute: Route;
  noSubscriptionRoute?: Route;
}): Promise<void> => {
  const routes: Record<string, Route | undefined> = {
    endedSubscription: endedSubscriptionRoute,
    activeSubscription: activeSubscriptionRoute,
    noSubscription: noSubscriptionRoute,
  };

  try {
    const session = await getServerSession();
    const isAuthenticated = !!session;

    if (isAuthenticated) {
      const redirectUrl = await getSubscriptionRedirect({
        routes,
        allowUnauthenticated: true,
      });

      if (redirectUrl) {
        redirect(redirectUrl);
      }
    }
  } catch (error) {
    console.error('Error in redirectBySubscriptionStatus:', error);
    throw error;
  }
};

import type { Route } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';

type AuthRedirectOptions = {
  routes: {
    activeSubscription: Route;
    endedSubscription: Route;
    noSubscription?: Route;
    hasSubscription?: Route;
    hasUpsellings?: Route;
  };
  allowUnauthenticated?: boolean;
  redirectIfAuthenticated?: boolean;
};

export const redirectBySubscriptionStatus = async (options: AuthRedirectOptions): Promise<void> => {
  const {
    routes,
    allowUnauthenticated = true,
    redirectIfAuthenticated = true,
  } = options;

  try {
    const session = await auth();
    const isAuthenticated = !!session;

    if (isAuthenticated && redirectIfAuthenticated) {
      const redirectUrl = await getSubscriptionRedirect({
        routes,
        allowUnauthenticated,
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

export const redirectIfAuthenticated = async ({
  activeSubscriptionRoute,
  endedSubscriptionRoute,
  noSubscriptionRoute,
}: {
  activeSubscriptionRoute?: Route;
  endedSubscriptionRoute: Route;
  noSubscriptionRoute?: Route;
}): Promise<void> => {
  const routes: any = {
    endedSubscription: endedSubscriptionRoute,
  };

  if (activeSubscriptionRoute) {
    routes.activeSubscription = activeSubscriptionRoute;
  }

  if (noSubscriptionRoute) {
    routes.noSubscription = noSubscriptionRoute;
  }

  return redirectBySubscriptionStatus({
    routes,
    redirectIfAuthenticated: true,
  });
};

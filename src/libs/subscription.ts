import type { Route } from 'next';
import { redirect } from 'next/navigation';

import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { getServerSession } from '@/server/session/session.utils';
import type { SubscriptionStatus } from '@/types/subscription';
import type { User } from '@/types/user';

import { composeMember } from './membership-mock';

/**
 * The signed-in member as a server render sees one: the account read from the
 * new API, stitched together with the membership facts no endpoint publishes yet.
 *
 * This is the server-side composer. Every screen that used to fetch the funnel's
 * aggregate calls it, so there is one place to rewrite when the commercial
 * endpoints exist — see the mock module, and the ADR it points at.
 */
export const getUser = async (): Promise<User> => {
  const account = await apiServerClient['/api/v1/user/me'].GET().then(unwrapApiResponse);

  return composeMember(account);
};

/**
 * The member, or `undefined` when the caller is an anonymous visitor.
 *
 * The session's own `isLoggedIn` flag decides, rather than the object: an empty
 * session is still an object, so testing truthiness would admit a visitor who
 * has none.
 *
 * A guest is an ordinary answer here, not a failure. The public funnel screens
 * run this on every render, and the member-area ones are already behind the
 * middleware's redirect and their own session check, so nothing downstream needs
 * `/user/me` to raise a 401 on their behalf.
 */
export const getSignedInUser = async (): Promise<User | undefined> => {
  const session = await getServerSession();

  return session?.isLoggedIn ? getUser() : undefined;
};

/** The statuses that mean no payment has ever succeeded. */
const NEVER_PAID: SubscriptionStatus[] = ['initial', 'incomplete', 'incomplete_expired'];

/** Has paid for a subscription at some point, whatever became of it since. */
export const hasSubscription = (user: User) => !NEVER_PAID.includes(user.subscription_status);

/** Has access now. A cancelled subscription still runs to the end of its period. */
export const hasActiveSubscription = (user: User) =>
  user.subscription_status === 'active' || user.subscription_status === 'cancelled';

/** Has run out and will not renew — the member has to start a new subscription. */
export const hasEndedSubscription = (user: User) => user.subscription_status === 'expired';

/**
 * Where the three states of a subscription send a member. A route left out means
 * "stay on this screen".
 */
export type SubscriptionRoutes = {
  /** Never paid. */
  noSubscription?: Route;
  /** Paying, or cancelled but still inside the paid period. */
  activeSubscription?: Route;
  /** Expired. */
  endedSubscription?: Route;
};

/**
 * The route this member's subscription state calls for, or `undefined` to stay
 * put. A guest always stays put — a screen that must not be seen by one guards
 * that itself.
 */
export const getSubscriptionRedirect = async (options: { routes: SubscriptionRoutes }): Promise<Route | undefined> => {
  const user = await getSignedInUser();

  if (!user) {
    return undefined;
  }

  if (!hasSubscription(user)) {
    return options.routes.noSubscription;
  }

  if (hasActiveSubscription(user)) {
    return options.routes.activeSubscription;
  }

  return options.routes.endedSubscription;
};

/**
 * The same decision, taken. Every public screen that a member has no business
 * seeing calls this at the top of its render.
 *
 * `endedSubscription` is required because the expired member has nowhere else to
 * be: leaving them on a marketing page with no way back to billing is never the
 * intent, and every call site already passes it.
 */
export const redirectIfAuthenticated = async (
  routes: SubscriptionRoutes & { endedSubscription: Route },
): Promise<void> => {
  const redirectUrl = await getSubscriptionRedirect({ routes });

  if (redirectUrl) {
    redirect(redirectUrl);
  }
};

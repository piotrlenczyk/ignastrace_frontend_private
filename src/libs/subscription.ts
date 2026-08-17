import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { getServerSession } from '@/server/session/session.utils';
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

type SubscriptionCheckOptions = {
  user?: User;
  allowUnauthenticated?: boolean;
};

export const getUserForPoliciesCheck = async ({ user, allowUnauthenticated = false }: SubscriptionCheckOptions) => {
  if (allowUnauthenticated) {
    const session = await getServerSession();

    // The sealed session's own flag, rather than the object — an empty session is
    // an object, so testing truthiness admits a visitor who has none.
    if (!session?.isLoggedIn) {
      return undefined;
    }
  }

  if (!user) {
    user = await getUser();
  }
  return user;
};

// A user has a subscription if it has paid for a subscription any time in the past
export const hasSubscription = async (options: SubscriptionCheckOptions = {}) => {
  const checkedUser = await getUserForPoliciesCheck(options);
  if (!checkedUser) {
    return false;
  }
  return (
    checkedUser.subscription_status !== 'initial' &&
    checkedUser.subscription_status !== 'incomplete' &&
    checkedUser.subscription_status !== 'incomplete_expired'
  );
};

// A cancelled subscription is still active but will expire when the current period ends
export const hasActiveSubscription = async (options: SubscriptionCheckOptions = {}) => {
  const checkedUser = await getUserForPoliciesCheck(options);
  if (!checkedUser) {
    return false;
  }
  return checkedUser.subscription_status === 'active' || checkedUser.subscription_status === 'cancelled';
};

// Those are subscriptions that have ended and can't be renewed. The user will have to start a new subscription.
export const hasEndedSubscription = async (options: SubscriptionCheckOptions = {}) => {
  const checkedUser = await getUserForPoliciesCheck(options);
  if (!checkedUser) {
    return false;
  }
  return checkedUser.subscription_status === 'expired';
};

export const hasUpsellings = async (options: SubscriptionCheckOptions = {}) => {
  const checkedUser = await getUserForPoliciesCheck(options);
  if (!checkedUser) {
    return false;
  }
  return checkedUser.upsellings.length > 0;
};

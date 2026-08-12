import { auth } from '@/auth';
import type { User } from '@/types/user';

import { getApi } from './server/api';

export const getUser = async () => {
  const api = await getApi();
  const user = await api.get<User>('/user');

  return user;
};

type SubscriptionCheckOptions = {
  user?: User;
  allowUnauthenticated?: boolean;
};

export const getUserForPoliciesCheck = async ({ user, allowUnauthenticated = false }: SubscriptionCheckOptions) => {
  if (allowUnauthenticated) {
    const session = await auth();
    if (!session) {
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
  return checkedUser.subscription_status !== 'initial' && checkedUser.subscription_status !== 'incomplete'
    && checkedUser.subscription_status !== 'incomplete_expired';
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

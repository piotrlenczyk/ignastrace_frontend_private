'use server';

import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';
import type { SubscriptionDetails } from '@/types/pricing.types';

export const getSubscription = async () => {
  const result = await paymentsApiServerClient['/subscriptions'].GET({
    next: {
      tags: ['subscription'],
    },
  });

  if (result.data) {
    // Has access if
    // - subscription is active
    // - subscription is cancelled and not expired
    // - subscription is expired and has next payment attempt
    const hasAccessActive = result.data.status === 'active';
    const hasAccessCancelled = result.data.status === 'cancelled' && new Date(result.data.expiresAt) > new Date();
    const hasAccessExpired = !!(result.data.status === 'expired' && result.data.nextPaymentAttemptAt);

    return {
      ...result,
      data: {
        ...result.data,
        hasAccess: hasAccessActive || hasAccessCancelled || hasAccessExpired,
        calculatedStatus: hasAccessExpired ? 'pending' : result.data.status,
        couldCancel: hasAccessActive || hasAccessExpired,
        couldReactivate: hasAccessCancelled,
      } satisfies SubscriptionDetails,
    };
  }

  return result;
};

import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';
import type { SubscriptionDetails } from '@/types/pricing.types';

/**
 * The member's subscription as the payments service holds it, with the four
 * facts a screen actually branches on computed once.
 *
 * A read, not an action — which is why it lives here rather than in the actions
 * module it was written in: every export of a `'use server'` module is a callable
 * endpoint, and a getter has no business being one.
 *
 * Nothing is unwrapped. "Payments holds no subscription for this caller" arrives
 * as a 404, and that is an ordinary answer on this path rather than a failure:
 * the billing screen reads it as the absence of a record and redirects, so it has
 * to be a branch and not a thrown error.
 *
 * Every other refusal reads as that same absence, which is deliberate and is the
 * sharp edge of this getter: a caller cannot tell "no subscription" from an
 * outage. Rejecting on anything but a 404 would be worse while ADR 0023 stands —
 * an environment with no payments credential configured sends the call
 * unauthenticated, so the ordinary answer there is a refusal, and throwing on it
 * would put an error page in front of every member instead of the redirect the
 * screen already had.
 */
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

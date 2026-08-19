'use server';

import { env } from 'process';
import { z } from 'zod';

import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';
import type { SubscriptionDetails } from '@/types/pricing.types';

import { actionClient } from '../lib/safe-action';

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

export const actionSendPlacedOrderEvent = actionClient
  .inputSchema(
    z.object({
      amount: z.number(),
      currency: z.string(),
      transactionId: z.string(),
      email: z.string(),
      plan: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const klaviyoEnabled = env.PUBLIC_FEATURE_KLAVIYO === '1';
    if (!env.PRIVATE_KLAVIYO_API_KEY || !klaviyoEnabled) {
      return;
    }
    console.log('actionSendPlacedOrderEvent', parsedInput);
    return true;
    // TODO: [refactor] add klaviyo integration
    // return klaviyoEventsApiService.sendPlacedOrderEvent({
    //   amount: parsedInput.amount,
    //   currency: parsedInput.currency,
    //   transactionId: parsedInput.transactionId,
    //   email: parsedInput.email,
    //   plan: parsedInput.plan,
    // });
  });

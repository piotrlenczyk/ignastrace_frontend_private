'use server';

import { z } from 'zod';

import { unwrapApiResponse } from '@/network/http-response-handler';
import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';
import { getSubscription } from '@/server/getters/subscription.getters';
import { actionClient } from '@/server/lib/safe-action';

export const actionStartStripeSubscription = actionClient
  .inputSchema(
    z.object({
      priceId: z.string(),
      paymentMethodId: z.string(),
      trackingMetadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const currentSubscription = await getSubscription();

    const shouldUpdateSubscription = currentSubscription?.data?.calculatedStatus === 'pending';

    if (shouldUpdateSubscription) {
      return paymentsApiServerClient['/subscriptions/stripe/payment-method']
        .POST({
          body: {
            paymentMethodId: parsedInput.paymentMethodId,
          },
        })
        .then(unwrapApiResponse);
    }

    // const trackingMetadata = await getEnrichedTrackingMetadata(session, input.trackingMetadata);

    return paymentsApiServerClient['/subscriptions/stripe']
      .POST({
        body: {
          priceId: parsedInput.priceId,
          paymentMethodId: parsedInput.paymentMethodId,
          // TODO: [refactor] add tracking metadata
          // trackingMetadata,
        },
      })
      .then(unwrapApiResponse);
  });

export const actionSyncStripeSubscriptionStatus = actionClient.action(async () => {
  return paymentsApiServerClient['/subscriptions/stripe/sync'].POST().then(unwrapApiResponse);
});

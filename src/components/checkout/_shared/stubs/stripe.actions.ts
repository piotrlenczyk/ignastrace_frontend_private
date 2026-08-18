'use server';

import { z } from 'zod';

import { actionClient } from '@/server/lib/safe-action';

import { type paymentsSchemas } from '../types/paymentsClient';

/**
 * TODO: payments integration.
 *
 * Stub replacements for resumewise's Stripe payment actions. They preserve the
 * original signatures (input schema + resolved data shape) so the copied
 * checkout components type-check, but reach no payments backend: each throws
 * until the future integration task (issue #62) wires them to ignastrace's
 * payments-api through the payments-api server client and cookie auth.
 *
 * The typed success return mirrors resumewise's payment-action shape rather than
 * ADR-0011's "return nothing on success"; that is deliberate — see ADR-0019.
 */

const TODO_MESSAGE = 'TODO: payments integration';

export const actionStartStripeSubscription = actionClient
  .schema(
    z.object({
      priceId: z.string(),
      paymentMethodId: z.string(),
      trackingMetadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .action(async (): Promise<paymentsSchemas['CreateStripeSubscriptionResponseDto']> => {
    throw new Error(TODO_MESSAGE);
  });

export const actionSyncStripeSubscriptionStatus = actionClient.action(async (): Promise<void> => {
  throw new Error(TODO_MESSAGE);
});

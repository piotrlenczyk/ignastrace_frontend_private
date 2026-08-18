'use server';

import { z } from 'zod';

import { actionClient } from '@/server/lib/safe-action';

/**
 * TODO: payments integration.
 *
 * Stub replacement for resumewise's `actionSendPlacedOrderEvent`. It keeps the
 * original placed-order input signature so `CheckoutProvider`'s success handler
 * type-checks, but sends nothing — it throws until the future integration task
 * (issue #62) wires it to the real analytics backend.
 */

const TODO_MESSAGE = 'TODO: payments integration';

export const actionSendPlacedOrderEvent = actionClient
  .schema(
    z.object({
      amount: z.number(),
      currency: z.string(),
      transactionId: z.string(),
      email: z.string(),
      plan: z.string(),
    }),
  )
  .action(async (): Promise<void> => {
    throw new Error(TODO_MESSAGE);
  });

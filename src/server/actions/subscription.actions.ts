'use server';

import { z } from 'zod';

import { getServerSession } from '@/server/session/session.utils';
import { SUBSCRIPTION_PLANS } from '@/types/pricing.types';

import { actionClient } from '../lib/safe-action';

/**
 * What was bought, reported to the marketing platform.
 *
 * Still a placeholder that logs — the Klaviyo integration is separate work — but
 * it is called with arguments that are true: the product the payments service
 * billed, the amount and currency of the price row it billed from, and the
 * payment's own identifier where the provider published one — absent rather than
 * empty where it did not, so marketing data cannot mistake a missing identifier
 * for a blank one. What it does *not* take is an identity. The caller is
 * whoever the sealed session says it is, so a page script cannot report a
 * purchase as somebody else.
 *
 * The environment switch this used to return early on is gone rather than moved:
 * it named variables no environment file here defines, so it read as
 * configurable when the configuration did not exist. The real switch arrives with
 * the real integration, through settings, as ADR 0020 requires.
 */
export const actionSendPlacedOrderEvent = actionClient
  .inputSchema(
    z.object({
      amount: z.number(),
      currency: z.string(),
      transactionId: z.string().optional(),
      plan: z.enum(SUBSCRIPTION_PLANS),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await getServerSession();

    // TODO: [refactor] add klaviyo integration
    console.log('actionSendPlacedOrderEvent', { ...parsedInput, email: session?.user.email });
  });

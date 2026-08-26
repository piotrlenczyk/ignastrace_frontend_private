'use server';

import { z } from 'zod';

import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';
import { getServerSession } from '@/server/session/session.utils';
import { SUBSCRIPTION_PLANS } from '@/types/pricing.types';

import { actionClient } from '../lib/safe-action';
import { cancelSubscriptionByEmailSchema } from './subscription.schemas';

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

/**
 * The public cancellation, as the form on `/cancellation` submits it: an address
 * typed by somebody who is not signed in, and a subscription cancelled.
 *
 * Two upstreams, in this order and no other. The payments endpoint cancels by
 * user id, the form collects an address, and nothing on a public page can bridge
 * the two — so the address is resolved against the API first and the id that
 * comes back is what is cancelled. A failure to resolve is the end of it: the
 * second call is never made, which is what keeps a mistyped address from
 * reaching an endpoint whose whole job is to cancel without asking.
 *
 * A server action rather than a mutation through the query hooks, and that is
 * not a preference. `/internal/subscriptions/cancel` is in a path family the
 * payments proxy refuses to the browser outright, and the address lookup is on
 * the API proxy's refused list because from a page script it is an account
 * enumerator. Both are reachable only from here. See
 * docs/adr/0035-the-public-cancellation-follows-onto-payments-through-a-server-action.md.
 *
 * `cancellationSource` is the field the payments service publishes for telling
 * its two cancellation surfaces apart, and `public_cancellation` is the value it
 * publishes for this one. No `cancellationReason` is sent: that field is for a
 * member's own words and this form asks for none.
 */
export const actionCancelSubscriptionByEmail = actionClient
  .inputSchema(cancelSubscriptionByEmailSchema)
  .action(async ({ parsedInput: { email } }) => {
    const { id } = await apiServerClient['/api/v1/auth/get-user-by-email']
      .POST({ body: { email } })
      .then(unwrapApiResponse);

    await paymentsApiServerClient['/internal/subscriptions/cancel']
      .POST({ body: { id, cancellationSource: 'public_cancellation' } })
      .then(unwrapApiResponse);
  });

import { z } from 'zod';

/*
 * What the subscription actions accept. They live here rather than beside the
 * actions because a `'use server'` module may only export async functions, and
 * separately from the cancellation form's own schema because that one is built
 * per render around translated messages — this validates the input, not the
 * wording.
 */

/**
 * A public cancellation request: an address and nothing else.
 *
 * The address is all the screen collects and all the member is asked for. It is
 * not an identity — nobody signed in to reach this form — so it is validated as
 * an address and no further: whether it belongs to an account is the lookup's
 * answer, not this schema's.
 */
export const cancelSubscriptionByEmailSchema = z.object({
  email: z.email(),
});

'use server';

import { z } from 'zod';

import { actionClient } from '@/server/lib/safe-action';

/**
 * TODO: payments integration.
 *
 * Stub replacement for resumewise's `actionUpdateZipCode`. It keeps the original
 * signature (optional zip-code input, `{ isZipCodeValid, zipCode }` result) that
 * the copied card-payment flows read, but reaches no backend — it throws until
 * the future integration task (issue #62) wires it to the real user API.
 *
 * The typed success return mirrors resumewise's action shape rather than
 * ADR-0011's "return nothing on success"; that is deliberate — see ADR-0019.
 */

const TODO_MESSAGE = 'TODO: payments integration';

export const actionUpdateZipCode = actionClient
  .schema(
    z.object({
      zipCode: z.string().optional(),
    }),
  )
  .action(async (): Promise<{ isZipCodeValid?: boolean | null; zipCode?: string }> => {
    throw new Error(TODO_MESSAGE);
  });

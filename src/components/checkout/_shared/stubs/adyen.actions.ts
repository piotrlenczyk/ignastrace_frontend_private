'use server';

import { z } from 'zod';

import { actionClient } from '@/server/lib/safe-action';

import { type paymentsSchemas } from '../types/paymentsClient';

/**
 * TODO: payments integration.
 *
 * Stub replacements for resumewise's Adyen payment actions. They preserve the
 * original signatures (input schema + resolved data shape) so the copied
 * checkout components type-check, but reach no payments backend: each throws
 * until the future integration task (issue #62) wires them to ignastrace's
 * payments-api through the payments-api server client and cookie auth.
 *
 * The typed success return mirrors resumewise's payment-action shape rather than
 * ADR-0011's "return nothing on success"; that is deliberate — see ADR-0019.
 */

const TODO_MESSAGE = 'TODO: payments integration';

export const actionLoadAdyenPaymentMethods = actionClient
  .schema(
    z.object({
      priceId: z.string(),
    }),
  )
  .action(async (): Promise<paymentsSchemas['AdyenPaymentMethodsResponseDto']> => {
    throw new Error(TODO_MESSAGE);
  });

export const actionCreateAdyenSubscription = actionClient
  .schema(
    z.object({
      priceId: z.string(),
      paymentData: z.object({
        paymentMethod: z.record(z.string(), z.unknown()),
        browserInfo: z.record(z.string(), z.unknown()).nullable().optional(),
        riskData: z.record(z.string(), z.unknown()).nullable().optional(),
        origin: z.string(),
        returnUrl: z.string(),
      }),
      walletData: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
      trackingMetadata: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .action(async (): Promise<paymentsSchemas['AdyenPayResponseDto']> => {
    throw new Error(TODO_MESSAGE);
  });

export const actionSubmitAdyenCompletionDetails = actionClient
  .schema(
    z.object({
      actionData: z.record(z.string(), z.unknown()).optional(),
      redirectResult: z.string().optional(),
    }),
  )
  .action(async (): Promise<paymentsSchemas['AdyenConfirmResponseDto']> => {
    throw new Error(TODO_MESSAGE);
  });

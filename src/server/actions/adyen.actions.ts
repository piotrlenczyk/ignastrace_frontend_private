'use server';

import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { unwrapApiResponse } from '@/network/http-response-handler';
import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';
import { actionClient } from '@/server/lib/safe-action';

export const actionLoadAdyenPaymentMethods = actionClient
  .inputSchema(
    z.object({
      priceId: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const locale = await getLocale();
    const response = await paymentsApiServerClient['/subscriptions/adyen/paymentMethods']
      .GET({
        params: {
          query: {
            priceId: parsedInput.priceId,
            locale,
          },
        },
      })
      .then(unwrapApiResponse);
    return response;
  });

export const actionCreateAdyenSubscription = actionClient
  .inputSchema(
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
  .action(async ({ parsedInput }) => {
    const locale = await getLocale();

    // const trackingMetadata = await getEnrichedTrackingMetadata(session, parsedInput.trackingMetadata);

    const response = await paymentsApiServerClient['/subscriptions/adyen']
      .POST({
        body: {
          priceId: parsedInput.priceId,
          locale,
          paymentData: parsedInput.paymentData,
          walletData: parsedInput.walletData,
          // TODO: [refactor] add tracking metadata
          // trackingMetadata,
        },
      })
      .then(unwrapApiResponse);

    return response;
  });

export const actionSubmitAdyenCompletionDetails = actionClient
  .inputSchema(
    z.object({
      actionData: z.record(z.string(), z.unknown()).optional(),
      redirectResult: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    if (!parsedInput.actionData && !parsedInput.redirectResult) {
      throw new Error('Supply either actionData or redirectResult');
    }

    const response = await paymentsApiServerClient['/subscriptions/adyen/confirm']
      .POST({
        body: {
          actionData: parsedInput.actionData,
          redirectResult: parsedInput.redirectResult,
        },
      })
      .then(unwrapApiResponse);

    return response;
  });

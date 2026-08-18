/**
 * TODO: payments integration.
 *
 * No-op replacement for resumewise's GTM analytics service. It exposes the same
 * `trackPurchase` signature `CheckoutProvider` calls on a successful payment,
 * but pushes nothing to any data layer — GTM analytics are wired in the future
 * integration task (issue #62).
 */
export const GTMService = {
  trackPurchase: (_args: {
    transactionId: string;
    actualValue: number;
    currency: string;
    email: string;
    provider: 'stripe' | 'adyen' | null;
  }): void => {},
};

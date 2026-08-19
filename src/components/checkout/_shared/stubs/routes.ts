/**
 * TODO: payments integration.
 *
 * Local path-constant replacement for resumewise's route registry. It exposes
 * only the two checkout builders `CheckoutProvider` navigates to on success,
 * returning fixed local paths. The real app routing is wired in the future
 * integration task (issue #62).
 */

type CheckoutRouteParams = {
  transactionId?: string;
  reportJobId?: string;
};

const withTransaction = (path: string, params?: CheckoutRouteParams): string => {
  const transactionId = params?.transactionId;
  return transactionId ? `${path}?transactionId=${transactionId}` : path;
};

export const buildRoute = {
  billingCheckoutSuccess: (params?: CheckoutRouteParams): string =>
    withTransaction('/billing/checkout/success', params),
  billingCheckoutThankYou: (params?: CheckoutRouteParams): string =>
    withTransaction('/billing/checkout/thank-you', params),
};

/**
 * TODO: payments integration.
 *
 * Fixed-flags replacement for resumewise's `useSettings` feature-flag hook. It
 * returns constant values for the only flags the copied checkout components read
 * — Adyen Google Pay, checkout ZIP code, and express-checkout auto-display — so
 * the flag-gated branches compile and behave predictably. Real feature flags are
 * wired in the future integration task (issue #62).
 */

type CheckoutSettings = {
  adyenGPayEnabled: boolean;
  checkoutZipCodeEnabled: boolean;
  expressCheckoutDisplayAutoEnabled: boolean;
};

const CHECKOUT_SETTINGS: CheckoutSettings = {
  adyenGPayEnabled: false,
  checkoutZipCodeEnabled: false,
  expressCheckoutDisplayAutoEnabled: false,
};

export const useSettings = (): CheckoutSettings => CHECKOUT_SETTINGS;

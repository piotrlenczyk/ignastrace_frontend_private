import { apiServerClient, type schemas } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

/**
 * The context a checkout screen carries into a Klaviyo event: a flow and a
 * product, both optional, both forwarded verbatim to Klaviyo as event
 * properties. The API's own DTO, so a screen cannot invent a third field.
 */
type KlaviyoEventContext = schemas['KlaviyoEventDto'];

/** Reported once when a checkout screen renders for a shopper who has not paid yet. */
export const reportCheckoutStarted = async (context: KlaviyoEventContext = {}): Promise<void> => {
  try {
    await unwrapApiResponse(await apiServerClient['/api/v1/klaviyo/checkout-started'].POST({ body: context }));
  } catch (cause) {
    console.error(`The Klaviyo event /api/v1/klaviyo/checkout-started could not be reported.`, cause);
  }
};

/** Reported once when a thank-you screen renders for a shopper who has. */
export const reportOrderConfirmed = async (context: KlaviyoEventContext = {}): Promise<void> => {
  try {
    await unwrapApiResponse(await apiServerClient['/api/v1/klaviyo/order-confirmed'].POST({ body: context }));
  } catch (cause) {
    console.error(`The Klaviyo event /api/v1/klaviyo/order-confirmed could not be reported.`, cause);
  }
};

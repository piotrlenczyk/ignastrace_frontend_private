import { apiServerClient, type schemas } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

/**
 * The context a checkout screen carries into a Klaviyo event: a flow and a
 * product, both optional, both forwarded verbatim to Klaviyo as event
 * properties. The API's own DTO, so a screen cannot invent a third field.
 */
export type KlaviyoEventContext = schemas['KlaviyoEventDto'];

type KlaviyoEventPath = '/api/v1/klaviyo/checkout-started' | '/api/v1/klaviyo/order-confirmed';

/**
 * One analytics event, reported and forgotten.
 *
 * Nothing here rejects, and that is the whole point of the module. All four call
 * sites are server components that do not wait for the answer — a payment that
 * went through is not undone by an event that did not — and an unawaited promise
 * that rejects is an unhandled rejection in a render rather than a logged
 * incident. So a refusal and an unreachable host are the same answer: the
 * incident is logged and the screen carries on.
 *
 * The frozen legacy client swallowed a failed `post` too, but it swallowed a 401
 * by signing the visitor out — which on the thank-you screen meant an analytics
 * event could end a session that had just paid. Nothing here redirects.
 */
const report = async (path: KlaviyoEventPath, context: KlaviyoEventContext): Promise<void> => {
  try {
    await unwrapApiResponse(await apiServerClient[path].POST({ body: context }));
  } catch (cause) {
    console.error(`The Klaviyo event ${path} could not be reported.`, cause);
  }
};

/** Reported once when a checkout screen renders for a shopper who has not paid yet. */
export const reportCheckoutStarted = (context: KlaviyoEventContext = {}): Promise<void> =>
  report('/api/v1/klaviyo/checkout-started', context);

/** Reported once when a thank-you screen renders for a shopper who has. */
export const reportOrderConfirmed = (context: KlaviyoEventContext = {}): Promise<void> =>
  report('/api/v1/klaviyo/order-confirmed', context);

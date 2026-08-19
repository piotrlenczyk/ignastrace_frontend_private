import type { CountryCode } from 'libphonenumber-js';

/**
 * What is switched on for this request, and where the person making it is asking
 * from — settled once on the server and true for the whole of that request.
 *
 * Three sources feed this: the API's `/features`, this application's environment,
 * and the override cookies a tester sets. A reader is not told which, on purpose.
 * A screen asks whether reverse lookup is on; whether that answer arrived from
 * the backend, from the Helm chart or from a cookie is the concern of
 * `settings.server.ts` alone.
 *
 * Every field is named for the intent, never for its source: `reverseLookupEnabled`,
 * not `ENABLE_REVERSE_LOOKUP`. The API hands back an untyped bag of
 * `SCREAMING_SNAKE` keys, and translating it here is what makes a misspelt flag
 * fail the type-check instead of quietly reading `undefined`.
 */
export type Settings = {
  /** Where the request came from: the `dev-country` cookie, then Cloudflare, then the fallback. */
  countryCode: CountryCode;
  /** Reverse lookup — the whole product area, from the API. */
  reverseLookupEnabled: boolean;
  /** The SMS consent step, from the API. */
  smsConsentEnabled: boolean;
  /** The post-purchase upsell flow. */
  upsellsEnabled: boolean;
  /** The card form asks for a ZIP code — on where the country expects one. */
  checkoutZipCodeEnabled: boolean;
  /** Google Pay through Adyen, in the checkout island. */
  adyenGPayEnabled: boolean;
  /** Stripe Express Checkout renders itself rather than waiting to be asked. */
  expressCheckoutDisplayAutoEnabled: boolean;
  /** The QA widget that sets the override cookies. Environment-only, by design. */
  testWidgetEnabled: boolean;
};

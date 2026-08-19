import { FALLBACK_COUNTRY } from '@/constants/countries';

import type { Settings } from './settings.types';

/**
 * What every setting is when nothing says otherwise: off, and asking from the
 * fallback country.
 *
 * These are the values a request gets when a source cannot be read — when
 * `/features` refuses or times out, the two flags it owns fall back to here and
 * the page renders anyway. Fail-closed is the deliberate choice: a feature that
 * silently disappears is visible to whoever looks at the screen, where a feature
 * that silently appears half-built is not.
 *
 * They double as the settings a story renders under, which is why they live in
 * their own module rather than inline in the server reader — Storybook cannot
 * import that one.
 */
export const SETTINGS_DEFAULTS: Settings = {
  countryCode: FALLBACK_COUNTRY,
  reverseLookupEnabled: false,
  smsConsentEnabled: false,
  upsellsEnabled: false,
  checkoutZipCodeEnabled: false,
  adyenGPayEnabled: false,
  expressCheckoutDisplayAutoEnabled: false,
  testWidgetEnabled: false,
};

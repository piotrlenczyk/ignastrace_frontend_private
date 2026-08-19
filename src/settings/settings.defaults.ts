import { FALLBACK_COUNTRY } from '@/constants/countries';

import type { Settings } from './settings.types';

/**
 * What every setting is when nothing says otherwise, and where the request is
 * taken to be asking from.
 *
 * These are the values a request gets when a source cannot be read — when
 * `/features` refuses or times out, the flags it owns fall back to here and the
 * page renders anyway. They are also what a flag the API has not declared yet
 * resolves to, since an absent key and an unreadable endpoint look alike from the
 * reader's side.
 *
 * A switch is off by default: a feature that silently disappears is visible to
 * whoever looks at the screen, where a feature that silently appears half-built is
 * not. **Reverse lookup and the SMS consent step are the two exceptions**, and
 * deliberately so — they are live features whose flags the API does not publish,
 * so failing closed on them would mean turning two shipped product areas off for
 * everyone the moment nobody is looking. They default on until the API's registry
 * carries them, at which point what the API says wins as it does for the rest.
 *
 * They double as the settings a story renders under, which is why they live in
 * their own module rather than inline in the server reader — Storybook cannot
 * import that one.
 */
export const SETTINGS_DEFAULTS: Settings = {
  countryCode: FALLBACK_COUNTRY,
  reverseLookupEnabled: true,
  smsConsentEnabled: true,
  sexOffenderReportEnabled: false,
  upsellsEnabled: false,
  checkoutZipCodeEnabled: false,
  adyenGPayEnabled: false,
  expressCheckoutDisplayAutoEnabled: false,
  testWidgetEnabled: false,
};

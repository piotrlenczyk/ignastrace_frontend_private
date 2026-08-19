import { type CountryCode, isSupportedCountry } from 'libphonenumber-js';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';

import { COUNTRIES_REQUESTING_ZIP, DEV_COUNTRY_COOKIE_NAME, FALLBACK_COUNTRY } from '@/constants/countries';
import { legacyApiUrl } from '@/network/legacy/legacy-api-url';

import { type OverridableSetting, SETTINGS_OVERRIDE_COOKIES } from './settings.cookies';
import { SETTINGS_DEFAULTS } from './settings.defaults';
import { isFlagOn, resolveFlag } from './settings.flags';
import type { Settings } from './settings.types';

/*
 * Where the three sources are read and reconciled — the only module that knows
 * there are three. It is server-side by construction rather than by declaration:
 * `next/headers` cannot resolve in a client component, which is the same
 * guarantee the session utilities and the server client rely on.
 */

/**
 * The key each backend-owned flag is published under.
 *
 * TEMPORARY, and the reason this read is not on the new API's generated client:
 * the two backends publish different flag sets under the same endpoint name. The
 * new API's is camel-cased, needs a bearer, and does not carry these two at all —
 * its specification's example is a single unrelated switch. Asking it for these
 * would mean both features reading off for everyone, which the fail-closed
 * defaults would make silent.
 *
 * So the flags stay on the backend that publishes them until the new API does,
 * and the change at that point is this constant plus the read below.
 */
const BACKEND_FLAG_KEYS = {
  reverseLookupEnabled: 'ENABLE_REVERSE_LOOKUP',
  smsConsentEnabled: 'ENABLE_SMS_CONSENT',
} as const;

/** The environment variable each flag it owns is configured by. */
const ENV_FLAG_VARIABLES = {
  upsellsEnabled: 'FEATURE_UPSELLS',
  checkoutZipCodeEnabled: 'FEATURE_REQUEST_ZIP',
  adyenGPayEnabled: 'FEATURE_ADYEN_GPAY',
  expressCheckoutDisplayAutoEnabled: 'FEATURE_EXPRESS_CHECKOUT_AUTO',
  testWidgetEnabled: 'FEATURE_TEST_WIDGET',
} as const;

/**
 * The country this request is asking from: the development cookie first, then
 * what Cloudflare placed the address in, then the fallback.
 *
 * Both are checked against the country codes that exist rather than cast to one.
 * `XX` — Cloudflare saying it could not place the address — needs no special case
 * under that rule, and a mistyped development cookie stops being a country the
 * currency and phone-number helpers then have to survive.
 */
const readCountryCode = async (): Promise<CountryCode> => {
  const override = (await cookies()).get(DEV_COUNTRY_COOKIE_NAME)?.value;

  if (override && isSupportedCountry(override)) {
    return override;
  }

  const reported = (await headers()).get('cf-ipcountry');

  if (!reported || !isSupportedCountry(reported)) {
    return FALLBACK_COUNTRY;
  }

  return reported;
};

/**
 * The flags the backend publishes, or nothing if it could not be asked.
 *
 * A refusal and an unreachable host are the same answer here — this is not a
 * screen's own read, it is one input to a page that has to render either way. The
 * incident is logged and the caller falls back to the declared defaults; notably
 * there is no sign-out, which the frozen legacy client did on a 401 and which
 * turned a flag lookup in the root layout into a redirect for every visitor.
 *
 * A bare request rather than either generated client: the new API's client cannot
 * address this backend, and the frozen one is closed to new code. The endpoint
 * takes no credential — it answers the same for a visitor and a member — so there
 * is nothing here for a client to attach.
 */
const readBackendFlags = async (): Promise<Record<string, boolean> | null> => {
  try {
    const response = await fetch(`${legacyApiUrl()}/features`, { headers: { accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`The features endpoint answered ${response.status}.`);
    }

    return (await response.json()) as Record<string, boolean>;
  } catch (error) {
    console.error('The features endpoint could not be read; settings fall back to their defaults.', error);

    return null;
  }
};

/**
 * The settings for this request, read from the backend's flags, the environment,
 * the override cookies and the edge, and reconciled into one answer.
 *
 * Exported for its tests. Application code takes the cached export below, so that
 * the root layout and the six server components that read settings ask the API
 * once between them.
 */
export const _readServerSettings = async (): Promise<Settings> => {
  const cookieStore = await cookies();
  const countryCode = await readCountryCode();
  const backendFlags = await readBackendFlags();

  const override = (setting: OverridableSetting) => cookieStore.get(SETTINGS_OVERRIDE_COOKIES[setting])?.value;

  const fromBackend = (setting: keyof typeof BACKEND_FLAG_KEYS) =>
    resolveFlag({
      override: override(setting),
      source: backendFlags?.[BACKEND_FLAG_KEYS[setting]] ?? SETTINGS_DEFAULTS[setting],
    });

  /*
   * `testWidgetEnabled` is in the variables above but not in the override map, so
   * the settings this reads for are the intersection: an environment flag a
   * cookie is allowed to speak for.
   */
  const fromEnv = (setting: OverridableSetting & keyof typeof ENV_FLAG_VARIABLES) =>
    resolveFlag({ override: override(setting), source: isFlagOn(process.env[ENV_FLAG_VARIABLES[setting]]) });

  return {
    countryCode,
    reverseLookupEnabled: fromBackend('reverseLookupEnabled'),
    smsConsentEnabled: fromBackend('smsConsentEnabled'),
    upsellsEnabled: fromEnv('upsellsEnabled'),
    /*
     * The one derived flag, and the reason it is spelled out rather than read like
     * its neighbours: the variable turns the ask on, and the country decides
     * whether a ZIP code means anything. The override cookie applies to the
     * result, so a tester can see the field from anywhere.
     */
    checkoutZipCodeEnabled: resolveFlag({
      override: override('checkoutZipCodeEnabled'),
      source:
        isFlagOn(process.env[ENV_FLAG_VARIABLES.checkoutZipCodeEnabled]) &&
        COUNTRIES_REQUESTING_ZIP.includes(countryCode),
    }),
    adyenGPayEnabled: fromEnv('adyenGPayEnabled'),
    expressCheckoutDisplayAutoEnabled: fromEnv('expressCheckoutDisplayAutoEnabled'),
    /*
     * Environment-only, and not in the override map: the widget reads the
     * configuration back to whoever opens it.
     */
    testWidgetEnabled: isFlagOn(process.env[ENV_FLAG_VARIABLES.testWidgetEnabled]),
  };
};

/**
 * What is switched on for this request.
 *
 * Memoised for the render pass, so the root layout — which reads settings to hand
 * them to the client provider — and the server components that read them again
 * for themselves cost one flags request between them.
 */
export const getServerSettings = cache(_readServerSettings);

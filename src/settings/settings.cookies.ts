/**
 * The cookies that override a setting, by the setting they override.
 *
 * One prefix, one naming shape, one vocabulary of values (`settings.flags.ts`
 * reads them). Before this module the two overrides this application had
 * disagreed on all three: `enable-reverse-lookup` answered to `'true'` and
 * `dev-country` to a bare country code. The first is replaced by the entry
 * below; the second keeps its name and its shape, because it overrides a *value*
 * rather than a switch and belongs with the other country constants.
 *
 * Exported as a map rather than loose constants so the QA widget can render one
 * row per entry and stay right when a flag is added here.
 */
export const SETTINGS_OVERRIDE_COOKIES = {
  reverseLookupEnabled: 'overwrite_feature_reverse_lookup',
  smsConsentEnabled: 'overwrite_feature_sms_consent',
  upsellsEnabled: 'overwrite_feature_upsells',
  checkoutZipCodeEnabled: 'overwrite_feature_checkout_zip_code',
  adyenGPayEnabled: 'overwrite_feature_adyen_gpay',
  expressCheckoutDisplayAutoEnabled: 'overwrite_feature_express_checkout_auto',
} as const;

/**
 * The settings a cookie can override — every flag except `testWidgetEnabled`.
 *
 * The widget is left out on purpose. It reads the environment back to whoever
 * opens it, so summoning it from a cookie would let any visitor read this
 * application's configuration; it is turned on by deployment or not at all.
 */
export type OverridableSetting = keyof typeof SETTINGS_OVERRIDE_COOKIES;

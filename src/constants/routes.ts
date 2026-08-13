export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOADER: '/search',
  LOADER_COMPLETE: '/search-complete',
  FAQ: '/#faq',
  PRICING: '/pricing',
  CONTACT: '/contact',
  ABOUT: '/about',
  CANCELLATION: '/cancellation',

  // Auth Routes
  SIGN_IN: '/login',
  SIGN_UP: '/sign-up',

  // Checkout Flow
  CHECKOUT: '/checkout',
  SUCCESS: '/success',
  SUCCESS_WITH_UPSELLS: '/success?n-upgrade-1',
  THANK_YOU: '/thank-you',

  // Legal Pages
  PRIVACY_POLICY: '/privacy-policy',
  TERMS: '/terms',
  COOKIE_POLICY: '/privacy-policy?#cookie-policy',

  // Reverse Lookup Routes
  REVERSE_LOOKUP: {
    HOME: '/reverse-phone-lookup',
    SUMMARY: '/lookup-summary',
    SEARCH: '/lookup-search',
    SEARCH_COMPLETE: '/lookup-search-complete',
    SIGN_UP: '/lookup-sign-up',
    CHECKOUT: '/lookup-checkout',
    THANK_YOU: '/lookup-thank-you',
    UPSELLS: {
      PDF: '/lookup-upsell-pdf',
      DATA_BREACH: '/lookup-upsell-data-breach',
      SEX_OFFENDERS: '/lookup-upsell-sex-offenders',
    },
    MEMBER: {
      PHONE_LOOKUP: {
        FORM: '/memberarea/phone-lookup',
        PROGRESS: '/memberarea/lookup-search-complete',
      },
      UPSELL: {
        DATA_BREACH: '/memberarea/upsell/data-breach',
        SEX_OFFENDERS: '/memberarea/upsell/sex-offenders',
      },
    },
  },

  // Member Area Routes
  MEMBER: {
    ONBOARDING: {
      STEP_1: '/memberarea/onboarding-step-1',
      STEP_2: '/memberarea/onboarding-step-2',
      STEP_3: '/memberarea/onboarding-step-3',
    },
    FIND_BY_NUMBER: {
      HOME: '/memberarea/find-by-number',
      MESSAGE_SENDING: '/memberarea/find-by-number/message-sending',
      SUCCESS: '/memberarea/find-by-number/message-sending/success',
    },
    FIND_BY_LINK: {
      HOME: '/memberarea/find-by-link',
      SUCCESS: '/memberarea/find-by-link/success',
    },
    SEX_OFFENDERS_SEARCH: {
      HOME: '/memberarea/sex-offenders',
      RESULTS: '/memberarea/sex-offenders/results',
      REPORT: '/memberarea/sex-offenders/report',
    },
    STATUS: {
      HOME: '/memberarea/status',
      DETAIL: '/memberarea/status/detail',
      REPORT: '/memberarea/status/report',
      SEX_OFFENDERS: '/memberarea/status/report/sex-offenders',
      DATA_BREACH_HISTORY: '/memberarea/status/report/data-breach-history',
    },
    SETTINGS: {
      HOME: '/memberarea/settings/my-account',
      ACCOUNT: '/memberarea/settings/my-account',
      PASSWORD: '/memberarea/settings/change-password',
      BILLING: '/memberarea/settings/billing',
      RENEW: '/memberarea/settings/renew',
      NOTIFICATIONS: '/memberarea/notifications',
      OTHER: '/memberarea/settings/other',
      DELETE_ACCOUNT: '/memberarea/settings/other/account-deletion',
      GET_HELP: '/memberarea/settings/get-help',
    },
    DASHBOARD: '/memberarea/find-by-number',
    PRIVACY_POLICY: '/memberarea/privacy-policy',
    TERMS: '/memberarea/terms',
    CONTACT_US: '/memberarea/contact-us',
  },
} as const;

/** The member area is guarded as a whole, by prefix, rather than route by route. */
export const MEMBER_AREA_PREFIX = '/memberarea';

/** Carries the page an anonymous visitor was trying to reach through the login. */
export const REDIRECT_QUERY_PARAM = 'redirect';

/*
 * Route patterns for the guards, in `path-to-regexp` syntax. Every one carries
 * an optional leading locale segment, so a locale-prefixed URL is guarded
 * exactly as its unprefixed form is. Adding a guarded area is one edit here.
 */
const withOptionalLocale = (path: string) => `{/:locale}${path}`;

export const PROTECTED_ROUTE_PATTERNS = [
  `${MEMBER_AREA_PREFIX}{/*path}`,
  ROUTES.CHECKOUT,
  ROUTES.THANK_YOU,
  ROUTES.SUCCESS,
].map(withOptionalLocale);

export const AUTH_ROUTE_PATTERNS = [ROUTES.SIGN_IN, ROUTES.SIGN_UP, ROUTES.REVERSE_LOOKUP.SIGN_UP].map(
  withOptionalLocale,
);

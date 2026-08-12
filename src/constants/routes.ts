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

export const AUTH_ROUTES = [
  ROUTES.SIGN_UP,
];
export const PROTECTED_ROUTES = [
  ROUTES.CHECKOUT,
  ROUTES.THANK_YOU,
  ROUTES.MEMBER.ONBOARDING.STEP_1,
  ROUTES.MEMBER.ONBOARDING.STEP_2,
  ROUTES.MEMBER.ONBOARDING.STEP_3,
  ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
  ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING,
  ROUTES.MEMBER.FIND_BY_NUMBER.SUCCESS,
  ROUTES.MEMBER.FIND_BY_LINK.HOME,
  ROUTES.MEMBER.FIND_BY_LINK.SUCCESS,
  ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME,
  ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.RESULTS,
  ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.REPORT,
  ROUTES.MEMBER.STATUS.HOME,
  ROUTES.MEMBER.STATUS.DETAIL,
  ROUTES.MEMBER.STATUS.REPORT,
  ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY,
  ROUTES.MEMBER.SETTINGS.HOME,
  ROUTES.MEMBER.SETTINGS.ACCOUNT,
  ROUTES.MEMBER.SETTINGS.PASSWORD,
  ROUTES.MEMBER.SETTINGS.BILLING,
  ROUTES.MEMBER.SETTINGS.RENEW,
  ROUTES.MEMBER.SETTINGS.NOTIFICATIONS,
  ROUTES.MEMBER.SETTINGS.OTHER,
  ROUTES.MEMBER.SETTINGS.DELETE_ACCOUNT,
  ROUTES.MEMBER.SETTINGS.GET_HELP,
];

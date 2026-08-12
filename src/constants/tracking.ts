export const TRACKING_PREFIX = '__tracking_';

// Query params used for internal app state (not marketing/referral data).
// Their presence must not trigger a reset of existing tracking cookies.
export const INTERNAL_QUERY_PARAMS = new Set(['plan']);

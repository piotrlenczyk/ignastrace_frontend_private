'use client';

/**
 * No-op replacement for resumewise's client tracking helper. It keeps the
 * `getTrackingData` signature the copied checkout components pass into the
 * payment actions, but collects nothing.
 *
 * It outlives the payments integration deliberately: analytics and purchase
 * events are their own piece of work, and a payment does not depend on one.
 */
export const getTrackingData = (): Record<string, string> => ({});

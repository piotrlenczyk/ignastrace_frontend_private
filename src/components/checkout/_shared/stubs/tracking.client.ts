'use client';

/**
 * TODO: payments integration.
 *
 * No-op replacement for resumewise's client tracking helper. It keeps the
 * `getTrackingData` signature the copied checkout components pass into the
 * payment actions, but collects nothing — the real tracking stack is wired in
 * the future integration task (issue #62).
 */
export const getTrackingData = (): Record<string, string> => ({});

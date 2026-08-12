'use client';

export const clearSummaryTimer = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = 'summary-countdown-timer';
  const completedKey = `${storageKey}-completed`;

  localStorage.removeItem(storageKey);
  localStorage.removeItem(completedKey);
};

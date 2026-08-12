import { TRACKING_PREFIX } from '@/constants/tracking';

export const getTrackingData = (): Record<string, string> => {
  if (typeof document === 'undefined') {
    return {};
  }

  const trackingData: Record<string, string> = {};
  const cookies = document.cookie.split(';');

  cookies.forEach((cookie) => {
    const [fullKey, value] = cookie.trim().split('=');
    if (fullKey?.startsWith(TRACKING_PREFIX) && value) {
      const cleanKey = fullKey.slice(TRACKING_PREFIX.length);
      trackingData[cleanKey] = decodeURIComponent(value);
    }
  });

  return trackingData;
};

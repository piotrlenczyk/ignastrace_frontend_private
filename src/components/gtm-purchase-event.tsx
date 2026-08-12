'use client';

import { useEffect } from 'react';

type GTMPurchaseEventProps = {
  event: string;
  userId: string;
  email: string;
  value: number;
  currency: string;
};

const GTMPurchaseEvent = ({
  event,
  userId,
  email,
  value,
  currency,
}: GTMPurchaseEventProps) => {
  useEffect(() => {
    const key = `gtm_${event}:${userId}_event_fired`;

    if (localStorage.getItem(key)) {
      return;
    }

    (window as any).dataLayer = (window as any).dataLayer || [];

    (window as any).dataLayer.push({
      event,
      value,
      currency,
      email,
    });

    localStorage.setItem(key, '1');
  }, [event, email, value, currency]);

  return null;
};

export default GTMPurchaseEvent;

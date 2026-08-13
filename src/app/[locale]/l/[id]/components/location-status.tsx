'use client';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { LOCATION_STATUS, useUpdateUserLocation } from '../hooks/api/use-update-user-location';
import { useUserGeolocation } from '../hooks/use-user-geolocation';

export const LocationStatus = ({ id }: { id: string }) => {
  const { address, coords, status } = useUserGeolocation();
  const { mutate } = useUpdateUserLocation({});
  const t = useTranslations('pages.locate');

  useEffect(() => {
    if (!id) {
      return;
    }

    if (status === LOCATION_STATUS.REJECTED) {
      mutate({ id, status });
      return;
    }

    if (status === LOCATION_STATUS.APPROVED && address && coords) {
      mutate({
        address,
        id,
        lat: coords.latitude,
        lon: coords.longitude,
        status,
      });
    }
  }, [address, status, coords, id, mutate]);

  return (
    <div>
      <h1 className="h4 mb-1 font-bold">{t('thank_you')}</h1>
      <p className="min-h-[2lh] text-balance">{address || t(status as any)}</p>
    </div>
  );
};

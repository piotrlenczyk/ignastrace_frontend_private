import { getTranslations } from 'next-intl/server';
import React from 'react';

import { Logotype } from '@/components/logotype';
import { getApi } from '@/libs/server/api';
import type { LocationStatusResponse } from '@/types/location-status-response';

import { LocationStatus } from './components/location-status';

export default async function LocatePage({ params }: { params: { id: string } }) {
  const t = await getTranslations('pages.locate');
  const api = await getApi();
  const locationStatus = await api.get<LocationStatusResponse>(`/locations/${params?.id}/status`);

  return (
    <main className="container-small container grid place-content-center text-center">
      <div className="p-4">
        <Logotype className="mx-auto mb-4" />
        <div>
          {locationStatus.status === 'pending'
            ? (
                <LocationStatus id={params?.id} />
              )
            : (
                <div>
                  <h1 className="h4 mb-1 font-bold">
                    {t('link_expired')}
                  </h1>
                  <p className="min-h-[2lh] text-balance">{t('link_expired_explain')}</p>
                </div>
              )}
        </div>
      </div>
    </main>
  );
}

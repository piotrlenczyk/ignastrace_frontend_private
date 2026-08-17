'use client';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useDeclineConsentMutation } from '@/network/api/hooks/use-decline-consent-mutation';
import { useGrantConsentMutation } from '@/network/api/hooks/use-grant-consent-mutation';

import { useUserGeolocation } from '../hooks/use-user-geolocation';

/**
 * The consent prompt: it asks the browser where the recipient is and answers the
 * Consent link with what comes back.
 *
 * Two of the four things the browser can say are answers, and two are silence.
 * A granted permission whose address resolved is a grant, a denied permission is
 * a decline, and a browser without geolocation or an address that would not
 * resolve sends nothing at all — the API's grant requires an address, so a
 * location without one is not something this page can say.
 */
export const LocationStatus = ({ token, linkName }: { token: string; linkName?: string | null }) => {
  const { address, coords, status } = useUserGeolocation();
  const { mutate: grant } = useGrantConsentMutation();
  const { mutate: decline } = useDeclineConsentMutation();
  const t = useTranslations('pages.locate');

  useEffect(() => {
    if (status === 'rejected') {
      decline({ params: { path: { token } } });
      return;
    }

    if (status === 'located' && address && coords) {
      grant({
        params: { path: { token } },
        body: { address, latitude: coords.latitude, longitude: coords.longitude },
      });
    }
  }, [address, coords, status, token, grant, decline]);

  return (
    <div>
      {linkName ? <p className="mb-1">{linkName}</p> : null}
      <h1 className="h4 mb-1 font-bold">{t('thank_you')}</h1>
      {/*
       * `located` is the one status with no message of its own: reaching it means
       * an address resolved, and the address is what is shown in its place.
       */}
      <p className="min-h-[2lh] text-balance">{address || (status && status !== 'located' ? t(status) : null)}</p>
    </div>
  );
};

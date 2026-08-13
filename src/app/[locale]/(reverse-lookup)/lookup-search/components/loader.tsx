'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/libs/utils';

import { useCarrierQuery } from '../hooks/api/use-carrier-query';
import { LoadingBar } from './loading-bar';

const loadingTimePerStep = 2000;
const totalSteps = 6;

export const Loader = ({
  rawPhone,
  phoneNumber,
  countryName,
}: {
  rawPhone: string;
  phoneNumber: string;
  countryName: string;
}) => {
  const [loadedSteps, setLoadedSteps] = useState(0);
  const t = useTranslations('pages.reverse_lookup.search.components.loader.step_1');
  const { data: carrierResponse } = useCarrierQuery({ phone: rawPhone });
  const carrier = carrierResponse || t('carrier.loadedDefaultText');
  const isFirstStep = loadedSteps < 1;

  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (carrier && loadedSteps < totalSteps) {
      timeout = setTimeout(() => {
        setLoadedSteps((prev) => prev + 1);
      }, loadingTimePerStep);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [carrier, loadedSteps]);

  useEffect(() => {
    if (loadedSteps === totalSteps) {
      router.push(ROUTES.REVERSE_LOOKUP.SEARCH_COMPLETE);
    }
  }, [loadedSteps]);

  const loadingItems = useMemo(
    () => [
      { text: t('carrier.text'), loadedText: carrier || '' },
      { text: t('type.text'), loadedText: t('type.loadedText') },
      { text: t('country.text'), loadedText: countryName },
      { text: t('city.text'), loadedText: t('location.loadedText') },
      { text: t('location.text'), loadedText: t('city.loadedText') },
    ],
    [t, carrier, countryName],
  );

  return (
    <main className="s-main funnel-container animate-fade-in animation-duration-1000">
      <Image
        src="/images/search/radar.png"
        className="search-circle search-radar fixed"
        alt="Map"
        width={560}
        height={560}
        priority
      />
      <div className="w-full px-6">
        <div className="container grid max-w-[336px] gap-10 pb-16">
          <header className="flex flex-col items-center justify-between">
            <div className="brand-icon mb-4">
              {isFirstStep ? <Icon name="mobile-protection" /> : <Icon name="search" className="animate-fade-in" />}
            </div>
            <h1 className={cn('h4 font-normal', { 'animate-fade-in': !isFirstStep })}>
              {isFirstStep ? t('connecting') : t('searching')}
            </h1>
            <h2 className="h1 font-bold text-primary lg:text-4xl">{phoneNumber}</h2>
          </header>

          <ul className="grid gap-2">
            {loadingItems.map(({ text, loadedText }, index) => {
              const loading = loadedSteps < index + 1;
              const last = index === loadingItems.length - 1;
              return (
                <li key={text} className="flex items-center justify-between gap-2 text-strong">
                  {text}
                  <LoadingBar loading={loading} loadedText={loadedText} last={last} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <Image src="/images/search/located-bg.jpg" alt="located" width={1} height={1} loading="lazy" hidden />
    </main>
  );
};

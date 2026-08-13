'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import RecentLookups from './recentLookups';

export const LatestResults = ({ className, country }: { className?: string; country: string }) => {
  const t = useTranslations('pages.reverse_lookup.components.latest_results');

  return (
    <section className={cn('px-4 py-8 lg:px-0 lg:py-20', className)}>
      <h2 className="mb-3 text-center h3 font-bold lg:mb-2">{t('title')}</h2>
      <p className="h5 text-center text-weak">{t('subtitle')}</p>

      <RecentLookups originCountry={country} />
    </section>
  );
};

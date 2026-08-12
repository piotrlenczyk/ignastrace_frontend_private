'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { CustomerOpinionsCarousel } from '../../_components/customerOpinionsCarousel';

export const CustomerSayAbout = ({ className }: { className?: string }) => {
  const t = useTranslations('pages.reverse_lookup.search_complete.components.customer_say_about');

  return (
    <div className={cn('py-4 lg:py-8', className)}>
      <h3 className="w-full font-bold">{t('title')}</h3>
      <p className="mt-2 text-lg text-weak">{t('subtitle')}</p>
      <CustomerOpinionsCarousel />
    </div>
  );
};

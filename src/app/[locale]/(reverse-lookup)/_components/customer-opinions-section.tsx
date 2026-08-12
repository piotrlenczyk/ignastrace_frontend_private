'use client';

import { useTranslations } from 'next-intl';

import { CustomerOpinionsCarousel } from './customerOpinionsCarousel';

export const CustomerOpinionsSection = () => {
  const t = useTranslations('pages.reverse_lookup.components.customer_opinions');

  return (
    <div className="p-4 md:py-20 lg:px-0">
      <h3 className="mb-10 w-full text-center font-bold">{t('title')}</h3>
      <CustomerOpinionsCarousel />
    </div>
  );
};

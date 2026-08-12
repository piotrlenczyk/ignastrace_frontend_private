/* eslint-disable react-dom/no-dangerously-set-innerhtml */
'use client';

import { useTranslations } from 'next-intl';

import { CustomerOpinionsCarousel } from './customerOpinionsCarousel';

export const CustomerCarousel = ({ className }: { className: string }) => {
  const t = useTranslations('pages.reverse_lookup.components.customer_carousel');

  return (
    <section className={className}>
      <h2 className="h3 mb-3 font-bold lg:mb-3" dangerouslySetInnerHTML={{ __html: t.raw('title') }} />
      <p
        className="h5 text-weak"
      >
        {t('subtitle')}
      </p>

      <CustomerOpinionsCarousel />
    </section>
  );
};

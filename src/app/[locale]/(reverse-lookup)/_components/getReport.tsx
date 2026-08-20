'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import type { Price } from '@/types/pricing.types';

type GetReportProps = {
  price: Price;
  country: string;
};

const GetReport: React.FC<GetReportProps> = ({ price, country }) => {
  const t = useTranslations('pages.reverse_lookup.components.get_report');
  const formatPrice = createPriceFormatter();
  const locale = useLocale();
  /*
   * The row's charged amount, not its trial amount: this is the number the
   * checkout island opens on for the same row, and the two must agree. They are
   * the same field for a trial product; they part company only where the
   * catalogue publishes no trial one and the resolution falls back to the
   * outright four-week product, and there the charge is what to quote.
   */
  const trialPrice = formatPrice(price.finalAmount, price.currency, country, locale);

  const trialDays = price.trialDays;

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-alternate px-4 py-6 md:p-6">
      <h3 className="font-bold">{t('title')}</h3>
      <div
        className={`
          flex flex-col items-center justify-center gap-2 rounded-xl bg-weak px-4 py-3
          md:flex-row md:justify-between
        `}
      >
        <p className="text-center md:text-left">{t('lookup_today')}</p>
        <Image src="/images/reverse-lookup/avatar_stack.png" alt="avatars" width={152} height={32} />
      </div>
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-neutral bg-white p-4">
        <p className="flex w-full items-center justify-between gap-2">
          <span className="text-lg font-bold">{t('product_title')}</span>
          <span className="text-sm text-weak uppercase">{price.currency}</span>
        </p>
        <p className="flex w-full items-center justify-between gap-2 border-y border-neutral-10 py-2">
          <span className="text-sm">{t(trialDays === 1 ? 'product_24' : 'product')}:</span>
          <span className="h3 font-bold">{trialPrice}</span>
        </p>
        <Button size="lg" className="w-full">
          <Link href={ROUTES.REVERSE_LOOKUP.CHECKOUT}>{t('cta')}</Link>
        </Button>
        <p className="flex w-full items-center justify-between gap-2 text-[10px] text-weak md:text-xs">
          <span className="flex items-center gap-1 md:gap-2">
            <Icon name="check-circle" className="size-4 text-brand" />
            {t('trial_description')}
          </span>
          <span className="flex items-center gap-1 md:gap-2">
            <Icon name="safe" className="size-4 text-weak" />
            {t('secure')}
          </span>
        </p>
      </div>
    </div>
  );
};

export default GetReport;

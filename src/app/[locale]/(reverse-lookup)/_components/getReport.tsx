'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import React from 'react';

import { Button } from '@/components/ui/button';
import { IconCheckCircleLine, IconLockLine } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { useCldrFormatPrice } from '@/hooks/use-cldr-format-price';
import type { Products } from '@/types/products';

type GetReportProps = {
  product: Products;
  currency: string;
  country: string;
};

const GetReport: React.FC<GetReportProps> = ({ product, currency, country }) => {
  const t = useTranslations('pages.reverse_lookup.components.get_report');
  const formatPrice = useCldrFormatPrice();
  const locale = useLocale();
  const trialPrice = formatPrice(product.trial_charge_price, currency, country, locale);

  const trialDays = product.trial_days;

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-alternate px-4 py-6 md:p-6">
      <h3 className="font-bold">{t('title')}</h3>
      <div className={`
        flex flex-col items-center justify-center gap-2 rounded-xl bg-weak px-4 py-3 md:flex-row md:justify-between
      `}
      >
        <p className="text-center md:text-left">{t('lookup_today')}</p>
        <Image src="/images/reverse-lookup/avatar_stack.png" alt="avatars" width={152} height={32} />
      </div>
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-neutral bg-white p-4">
        <p className="flex w-full items-center justify-between gap-2">
          <span className="text-lg font-bold">
            {t('product_title')}
          </span>
          <span className="text-sm text-weak uppercase">{currency}</span>
        </p>
        <p className="flex w-full items-center justify-between gap-2 border-y border-neutral-10 py-2">
          <span className="text-sm">
            {t(trialDays === 1 ? 'product_24' : 'product')}
            :
          </span>
          <span className="h3 font-bold">{trialPrice}</span>
        </p>
        <Button size="lg" className="w-full">
          <Link href={ROUTES.REVERSE_LOOKUP.CHECKOUT}>
            {t('cta')}
          </Link>
        </Button>
        <p className="flex w-full items-center justify-between gap-2 text-[10px] text-weak md:text-xs">
          <span className="flex items-center gap-1 md:gap-2">
            <IconCheckCircleLine className="size-4 text-brand" />
            {t('trial_description')}
          </span>
          <span className="flex items-center gap-1 md:gap-2">
            <IconLockLine className="size-4 text-weak" />
            {t('secure')}
          </span>
        </p>
      </div>
    </div>
  );
};

export default GetReport;

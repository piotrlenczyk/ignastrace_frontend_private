'use client';

import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { Card } from '@/components/homepage/card';
import { Flag } from '@/components/ui/flag';
import { generateRecentLookups, type RecentLookupItem } from '@/utils/recent-lookups';

import { BlurredPhoneNumber } from './blurredPhoneNumber';

type RecentLookupsProps = {
  originCountry?: string;
};

const RecentLookups: React.FC<RecentLookupsProps> = ({ originCountry = 'ES' }) => {
  const t = useTranslations('pages.reverse_lookup.components.latest_results');
  const [items, setItems] = useState<RecentLookupItem[]>([]);

  useEffect(() => {
    setItems(generateRecentLookups(originCountry.toUpperCase()));

    const interval = setInterval(() => {
      setItems(generateRecentLookups(originCountry.toUpperCase()));
    }, 5000);

    return () => clearInterval(interval);
  }, [originCountry]);

  return (
    <div
      className="grid w-full gap-4 pt-4 md:grid-cols-3 md:gap-9 md:pt-14"
    >
      {items.length > 0 && items.map(item => (
        <Card
          key={`${item.phoneNumber}-${item.country}-${item.time}`}
          className="flex gap-4 p-4"
        >
          <Flag size={40} countryCode={item.country as CountryCode} />
          <div className="flex flex-col gap-1">
            <h3 className="text-base leading-6 font-semibold text-strong lg:text-base">
              {item.title}
            </h3>
            <p className="text-sm text-weak">
              {t('result.description', { time: item.time })}
            </p>
            <h3 className="h4 my-0.5 leading-6 font-semibold text-strong">
              <BlurredPhoneNumber phoneNumber={item.phoneNumber} />
            </h3>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RecentLookups;

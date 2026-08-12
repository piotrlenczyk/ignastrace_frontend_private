'use client';

import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';

import { IconInfoCircleLine, IconLockLine, IconPhoneLine, IconRefresh } from '@/components/ui/icon/icons';

type WhatYouGetProps = Record<string, never>;

const WHAT_YOU_GET_ITEMS = [
  <IconPhoneLine className="size-6 text-brand" key="phone" />,
  <IconLockLine className="size-6 text-brand" key="lock" />,
  <IconRefresh className="size-6 text-brand" key="refresh" />,
  <IconInfoCircleLine className="size-6 text-brand" key="info" />,
];

const WhatYouGet: React.FC<WhatYouGetProps> = () => {
  const t = useTranslations('pages.reverse_lookup.components.what_you_get');

  const items = useMemo(() => {
    return WHAT_YOU_GET_ITEMS.map((icon, index) => (
      <li key={index} className="flex items-start gap-2">
        {icon}
        <div>
          <p className="font-semibold">{t(`item_title_${index + 1}` as any)}</p>
          <p>{t(`item_${index + 1}` as any)}</p>
        </div>
      </li>
    ));
  }, [t]);

  return (
    <div className="flex flex-col gap-8 px-4 pt-3 pb-1 lg:p-6">
      <h3 className="font-bold">{t('title')}</h3>
      <ul className="flex flex-col gap-4 lg:gap-6">
        {items}
      </ul>
    </div>
  );
};

export default WhatYouGet;

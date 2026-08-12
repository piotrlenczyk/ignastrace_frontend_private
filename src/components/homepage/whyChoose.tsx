'use client';
import clsx from 'clsx';
import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import {
  IconFaceHappyLine,
  IconGlobeLine,
  IconLocationPinLine,
  IconShieldCheckLine,
  IconSparksAltLine,
} from '../ui/icon/icons';
import { Card } from './card';
import { Locator } from './locator';

type CardType = {
  id: string;
  Icon: typeof IconShieldCheckLine;
  title: any;
  description: any;
};

const cards: CardType[] = [
  { id: '1', Icon: IconShieldCheckLine, title: 'reasons.reason_1.title', description: 'reasons.reason_1.description' },
  { id: '2', Icon: IconFaceHappyLine, title: 'reasons.reason_2.title', description: 'reasons.reason_2.description' },
  { id: '3', Icon: IconSparksAltLine, title: 'reasons.reason_3.title', description: 'reasons.reason_3.description' },
  { id: '4', Icon: IconLocationPinLine, title: 'reasons.reason_4.title', description: 'reasons.reason_4.description' },
  { id: '5', Icon: IconGlobeLine, title: 'reasons.reason_5.title', description: 'reasons.reason_5.description' },
];

export const WhyChoose = ({ defaultCountry }: { defaultCountry: CountryCode }) => {
  const t = useTranslations('pages.index.why_choose');

  return (
    <div className="w-full bg-alternate px-0 lg:rounded-3xl">
      <div className="container-wide px-4 py-10 lg:py-20">
        <div className="container-medium text-center">
          <h2 className="mb-3 ">
            {t('title')}
          </h2>
          <p className="h4 text-weak">
            {t('subtitle')}
          </p>
        </div>
        <div
          className="grid w-full gap-4 py-6 md:grid md:grid-cols-[repeat(12,1fr)] md:gap-8 md:pt-16"
        >
          {
            cards.map(({ Icon, id, title, description }: CardType, i) => (
              <Card
                key={id}
                className={clsx(`flex gap-4 p-4  md:block lg:p-8`, i < 3 ? 'md:col-[span_4]' : 'md:col-[span_6]')}
              >
                <div
                  className="brand-icon-secondary-weak size-10 md:mb-6 lg:size-14"
                >
                  <Icon className="text-secondary" size="large" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold leading-6 text-strong lg:text-lg">{t(title) }</h3>
                  <p className="text-sm leading-5 text-weak">{t(description)}</p>
                </div>
              </Card>
            ))
          }
        </div>
        <Locator defaultCountry={defaultCountry} className="container-content px-0 pt-2 lg:pt-16" />
      </div>
    </div>

  );
};

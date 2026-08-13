'use client';
import type { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import WheelGesturesPlugin from 'embla-carousel-wheel-gestures';
import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/homepage/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

import type { CardType } from '../_types/why-use.types';
import { PhoneInput } from './phoneInput';

export const WhyUse = ({ defaultCountry }: { defaultCountry: CountryCode }) => {
  const t = useTranslations('pages.reverse_lookup.components.why_use');
  const options = { align: 'start', dragFree: true } as EmblaOptionsType;
  const [emblaRef] = useEmblaCarousel(options, [WheelGesturesPlugin()]);
  const cards: CardType[] = [
    {
      id: '1',
      icon: 'star-circle',
      title: t('reasons.reason_1.title'),
      description: t('reasons.reason_1.description'),
    },
    {
      id: '2',
      icon: 'star-circle',
      title: t('reasons.reason_2.title'),
      description: t('reasons.reason_2.description'),
    },
    {
      id: '3',
      icon: 'star-circle',
      title: t('reasons.reason_3.title'),
      description: t('reasons.reason_3.description'),
    },
    {
      id: '4',
      icon: 'star-circle',
      title: t('reasons.reason_4.title'),
      description: t('reasons.reason_4.description'),
    },
    {
      id: '5',
      icon: 'star-circle',
      title: t('reasons.reason_5.title'),
      description: t('reasons.reason_5.description'),
    },
  ];
  const useCases = [
    {
      description: t('steps.step_1.description'),
      number: 1,
    },
    {
      description: t('steps.step_2.description'),
      number: 2,
    },
    {
      description: t('steps.step_3.description'),
      number: 3,
    },
    {
      description: t('steps.step_4.description'),
      number: 4,
    },
    {
      description: t('steps.step_5.description'),
      number: 5,
    },
  ];

  return (
    <div className="w-full bg-alternate px-0 lg:rounded-3xl">
      <div className="container-wide px-4 py-10 lg:px-0 lg:py-20">
        <div className="text-center">
          <h2 className="mb-2 text-center h3 font-bold lg:mb-2">{t('title')}</h2>
          <p className="h5 text-center text-weak" dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
        </div>

        <div className="grid w-full gap-4 py-6 md:grid md:grid-cols-[repeat(12,1fr)] md:gap-8 md:pt-16 lg:pb-16">
          {cards.map(({ icon, id, title, description }: CardType, i) => (
            <Card
              key={id}
              className={cn(`flex flex-col gap-4 p-4 md:block lg:p-8`, i < 3 ? 'md:col-[span_4]' : 'md:col-[span_6]')}
            >
              <div className="brand-icon-secondary-weak size-10 md:mb-6 lg:size-14">
                <Icon name={icon} className="text-secondary" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-strong">{title}</h3>
                <p className="text-weak">{description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <span className="badge border-gray-100 bg-gray-50 px-4 text-base">{t('title_badge')}</span>
        </div>

        <h2 className="mt-6 text-center h3 font-bold">{t('title_2')}</h2>

        <div className="py-6 lg:hidden">
          <div ref={emblaRef} className="select-none">
            <div className="flex">
              {useCases.map((item) => (
                <div key={item.number} className="min-h-28 w-60 min-w-0 flex-[0_0_auto] pr-4 last:pr-0">
                  <Card className="flex size-full gap-4 p-4">
                    <Icon name="checkmark-badge" className="text-[26px] text-secondary" />
                    <div className="flex flex-col">
                      <p className="text-sm leading-5">{item.description}</p>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden w-full grid-cols-5 gap-8 pt-6 pb-16 lg:grid">
          {useCases.map((item) => (
            <Card key={item.number} className={cn('flex gap-4 p-4')}>
              <Icon name="checkmark-badge" className="text-[26px] text-secondary" />

              <div className="flex flex-col">
                <p className="text-sm leading-5">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="container-content text-center">
          <div className="h4 mb-4 font-bold lg:mb-6">{t('phone_input_label')}</div>
          <PhoneInput defaultCountry={defaultCountry} />
        </div>
      </div>
    </div>
  );
};

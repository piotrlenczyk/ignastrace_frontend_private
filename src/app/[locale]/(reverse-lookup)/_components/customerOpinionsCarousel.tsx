'use client';
import type { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { useTranslations } from 'next-intl';
import React from 'react';

import { Card } from '@/components/homepage/card';

import { StartRate } from './startRate';

type CustomerOpinionsCarouselProps = {
  className?: string;
};

export const CustomerOpinionsCarousel: React.FC<CustomerOpinionsCarouselProps> = ({
  className,
}) => {
  const t = useTranslations('pages.reverse_lookup.search_complete.components.customer_opinions_carousel');
  const options = { align: 'start', dragFree: true } as EmblaOptionsType;
  const [emblaRef] = useEmblaCarousel(options, [WheelGesturesPlugin()]);

  const getOpinionText = (key: string, field: string) => {
    return (t as any)(`${key}.${field}`);
  };

  return (
    <div className={className}>
      <div className="mt-6 select-none" ref={emblaRef}>
        <div className="flex">
          <div className="min-w-0 flex-[0_0_280px]">
            <Card className={`
              flex h-full min-h-[220px] flex-col justify-center gap-4 border border-gray-100 p-5
              shadow-[0px_20px_24px_-4px_rgba(0,0,0,0.08),0px_8px_8px_-4px_rgba(0,0,0,0.04)]
            `}
            >
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-bold">
                  {t('title')}
                </h4>

                <StartRate className="my-0.5 size-7" rating={Number.parseFloat(t('rate'))} />

                <p className="text-sm">
                  {t.rich('reviews', {
                    bold: chunks => <span className="font-bold">{chunks}</span>,
                  })}
                </p>
              </div>
            </Card>
          </div>
          {([
            'opinion_1',
            'opinion_2',
            'opinion_3',
            'opinion_4',
            'opinion_5',
            'opinion_6',
            'opinion_7',
            'opinion_8',
          ] as const).map(opinionKey => (
            <div
              key={opinionKey}
              className="min-w-0 flex-[0_0_300px] pl-5"
            >
              <Card className={`
                flex h-full min-h-[220px] flex-col justify-center border border-gray-100 p-5
                shadow-[0px_20px_24px_-4px_rgba(0,0,0,0.08),0px_8px_8px_-4px_rgba(0,0,0,0.04)]
              `}
              >
                <div className="flex flex-col gap-1">
                  {getOpinionText(opinionKey, 'title').trim() !== '' && (
                    <h4 className="text-lg font-semibold">
                      {getOpinionText(opinionKey, 'title')}
                    </h4>
                  )}
                  <StartRate className="size-[14px]" rating={Number.parseFloat(getOpinionText(opinionKey, 'rate'))} />
                  <p className="line-clamp-3 min-h-[72px]">
                    {getOpinionText(opinionKey, 'description')}
                  </p>
                  <p className="text-caption text-weak">
                    {getOpinionText(opinionKey, 'timeAgo')}
                    {' '}
                    •
                    {' '}
                    {getOpinionText(opinionKey, 'user')}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

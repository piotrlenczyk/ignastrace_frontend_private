'use client';
import type { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { AlertInfo } from './alert-info';

const Photos = ({ className, photos }: { className?: string; photos: SectionedReport['photos'] }) => {
  const t = useTranslations('pages.reverse_lookup.report.photos');

  const options = { align: 'start', dragFree: true } as EmblaOptionsType;
  const [emblaRef] = useEmblaCarousel(options, [WheelGesturesPlugin()]);
  const [invalidImages, setInvalidImages] = useState<Set<string>>(new Set());

  const isEmpty = photos.length === 0;

  /*
   * The new API states a photo as a URL and nothing else — where it came from is
   * gone. The tile's footer strip stays where it is, carrying the label this card
   * already showed for a source it did not recognise, so that the card's height
   * and layout do not shift under a member ahead of the redesign.
   */
  const photosData = photos.filter((photo) => !invalidImages.has(photo));

  const handleImageError = (imageSrc: string) => {
    setInvalidImages((prev) => new Set(prev).add(imageSrc));
  };

  return (
    <Card
      className={cn(
        'flex flex-col gap-6 overflow-hidden border-stroke-weak px-4 py-6 shadow-raised lg:px-6',
        className,
      )}
    >
      <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {!isEmpty && (
        <div className="select-none" ref={emblaRef}>
          <div className="-ml-4 flex">
            {photosData.map((photo) => (
              <div key={photo} className="min-w-0 flex-[0_0_200px] pl-4">
                <div className="overflow-hidden">
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                    <Image src={photo} alt="Avatar" fill onError={() => handleImageError(photo)} />
                  </div>
                  <div
                    className={`
                      flex min-h-[73px] items-center gap-2 rounded-b-2xl border border-t-0 border-stroke-weak px-3 py-4
                    `}
                  >
                    <p>{t('other')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default Photos;

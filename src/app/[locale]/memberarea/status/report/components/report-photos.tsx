'use client';
import type { EmblaOptionsType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { IconSocialFacebook, IconSocialWhatsapp } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';

import { AlertInfo } from './alert-info';

const Photos = ({ className, reverseLookup }: { className?: string; reverseLookup: ReverseLookup }) => {
  const t = useTranslations('pages.reverse_lookup.report.photos');
  const tSocial = useTranslations('pages.reverse_lookup.report.possible_social_media_accounts.sources');

  const options = { align: 'start', dragFree: true } as EmblaOptionsType;
  const [emblaRef] = useEmblaCarousel(options, [WheelGesturesPlugin()]);
  const [invalidImages, setInvalidImages] = useState<Set<string>>(new Set());

  const isEmpty = reverseLookup.reverse_lookup_photos.length === 0;

  const getSocialIcon = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return <IconSocialWhatsapp className="size-10" />;
      case 'facebook':
        return <IconSocialFacebook className="size-10 text-[#0966FF]" />;
      default:
        return null;
    }
  };

  const photosData = reverseLookup.reverse_lookup_photos
    .map((photo) => ({
      id: photo.id,
      image: photo.content,
      logo: getSocialIcon(photo.source),
      company: tSocial.has(photo.source as any) ? tSocial(photo.source as any) : t('other'),
    }))
    .filter((item) => !invalidImages.has(item.image));

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
            {photosData.map((item) => (
              <div key={item.id} className="min-w-0 flex-[0_0_200px] pl-4">
                <div className="overflow-hidden">
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                    <Image src={item.image} alt="Avatar" fill onError={() => handleImageError(item.image)} />
                  </div>
                  <div
                    className={`
                      flex min-h-[73px] items-center gap-2 rounded-b-2xl border border-t-0 border-stroke-weak px-3 py-4
                    `}
                  >
                    {item.logo}
                    {item.company && <p>{item.company}</p>}
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

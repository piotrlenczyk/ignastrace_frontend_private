import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { cn } from '@/libs/utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

const PhotosComponent = ({ className, sexOffenderData }: { className?: string; sexOffenderData: SexOffenderData }) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.photos');

  return (
    <Card className={cn('flex flex-col gap-6 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      {sexOffenderData.reverse_lookup_photos.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {sexOffenderData.reverse_lookup_photos.map((photo) => (
            <div key={photo.id}>
              <Image
                src={photo.content}
                alt="Photo"
                width={192}
                height={192}
                className="size-[192px] rounded-xl object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
export default PhotosComponent;

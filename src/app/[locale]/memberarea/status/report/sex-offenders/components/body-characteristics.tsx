import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import {
  IconArrowUp,
  IconCalendarDates,
  IconEye,
  IconFaceSmile,
  IconGender,
  IconPaintBrush,
  IconStarLine,
} from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

const BodyCharacteristicsComponent = ({
  className,
  sexOffenderData,
}: {
  className?: string;
  sexOffenderData: SexOffenderData;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.body_characteristics');
  const tValues = useTranslations('pages.reverse_lookup.report.sex_offenders.report.values');

  return (
    <Card className={cn('p-6 shadow-raised border border-stroke-weak flex flex-col gap-8', className)}>
      <h4 className="font-bold">
        {t('title')}
      </h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <IconCalendarDates size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('age')}</h5>
            <p>{sexOffenderData.age || '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconGender size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('sex')}</h5>
            <p>{sexOffenderData.sex ? tValues(`sex.${sexOffenderData.sex}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconEye size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('eye_color')}</h5>
            <p>{sexOffenderData.eye_color ? tValues(`eye_color.${sexOffenderData.eye_color}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconPaintBrush size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('hair_color')}</h5>
            <p>{sexOffenderData.hair_color ? tValues(`hair_color.${sexOffenderData.hair_color}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconFaceSmile size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('race')}</h5>
            <p>{sexOffenderData.race ? tValues(`race.${sexOffenderData.race}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconStarLine size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('ethnicity')}</h5>
            <p>{sexOffenderData.ethnicity ? tValues(`ethnicity.${sexOffenderData.ethnicity}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconArrowUp size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('height')}</h5>
            <p>{sexOffenderData.height ? `${sexOffenderData.height} inches` : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconStarLine size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('weight')}</h5>
            <p>{sexOffenderData.weight ? `${sexOffenderData.weight} lbs` : '--'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
export default BodyCharacteristicsComponent;

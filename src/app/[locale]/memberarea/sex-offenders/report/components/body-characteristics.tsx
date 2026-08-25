import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
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
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <Icon name="calendar" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('age')}</h5>
            <p>{sexOffenderData.age || '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="female" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('sex')}</h5>
            <p>{sexOffenderData.sex ? tValues(`sex.${sexOffenderData.sex}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="view" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('eye_color')}</h5>
            <p>{sexOffenderData.eye_color ? tValues(`eye_color.${sexOffenderData.eye_color}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="edit" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('hair_color')}</h5>
            <p>{sexOffenderData.hair_color ? tValues(`hair_color.${sexOffenderData.hair_color}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="user" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('race')}</h5>
            <p>{sexOffenderData.race ? tValues(`race.${sexOffenderData.race}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="star" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('ethnicity')}</h5>
            <p>{sexOffenderData.ethnicity ? tValues(`ethnicity.${sexOffenderData.ethnicity}`) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="arrow-up" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('height')}</h5>
            <p>{sexOffenderData.height ? `${sexOffenderData.height} inches` : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="star" className="text-brand" />
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

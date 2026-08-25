import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SexOffenderDetail } from '@/server/getters/reverse-lookup.getters';

import { useSexOffenderLabels } from '../../report-enum-labels';
import { inchesFromCm, offenderAge, poundsFromKg } from '../sex-offender-record';

const BodyCharacteristicsComponent = ({ className, record }: { className?: string; record: SexOffenderDetail }) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.body_characteristics');
  const label = useSexOffenderLabels();

  const age = offenderAge(record.dateOfBirth);
  const height = inchesFromCm(record.heightCm);
  const weight = poundsFromKg(record.weightKg);

  return (
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <Icon name="calendar" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('age')}</h5>
            <p>{age ?? '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="female" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('sex')}</h5>
            <p>{record.sex ? label.sex(record.sex) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="view" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('eye_color')}</h5>
            <p>{record.eyeColor ? label.eyeColor(record.eyeColor) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="edit" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('hair_color')}</h5>
            <p>{record.hairColor ? label.hairColor(record.hairColor) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="user" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('race')}</h5>
            <p>{record.race ? label.race(record.race) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="star" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('ethnicity')}</h5>
            <p>{record.ethnicity ? label.ethnicity(record.ethnicity) : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="arrow-up" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('height')}</h5>
            <p>{height ? `${height} inches` : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="star" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('weight')}</h5>
            <p>{weight ? `${weight} lbs` : '--'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
export default BodyCharacteristicsComponent;

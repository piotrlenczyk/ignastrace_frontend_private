import { useTranslations } from 'next-intl';

import { useSexOffenderLabels } from '@/app/[locale]/memberarea/status/report/report-enum-labels';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SexOffenderSearchReport } from '@/server/getters/sex-offender-search.getters';

const CENTIMETRES_PER_INCH = 2.54;
const POUNDS_PER_KILOGRAM = 2.2046226218;

/*
 * The new API states height in centimetres and weight in kilograms; this card is
 * labelled in inches and pounds and stays that way — an American product reading
 * American registries, where a height in centimetres reads as a defect rather
 * than as a unit choice.
 *
 * Six lines, duplicated from the reverse-lookup report's own sex-offender screen
 * rather than reached for across a directory boundary. Which units a card is
 * labelled in is that card's own decision, and the two screens are free to
 * disagree about it. The enumeration labels below are shared, because those exist
 * so that one list stays in step with the specification.
 */
const inchesFromCm = (heightCm: SexOffenderSearchReport['heightCm']) =>
  heightCm ? Math.round(heightCm / CENTIMETRES_PER_INCH) : undefined;

const poundsFromKg = (weightKg: SexOffenderSearchReport['weightKg']) =>
  weightKg ? Math.round(weightKg * POUNDS_PER_KILOGRAM) : undefined;

const BodyCharacteristicsComponent = ({
  className,
  record,
}: {
  className?: string;
  record: SexOffenderSearchReport;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.body_characteristics');
  const label = useSexOffenderLabels();

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
            <p>{record.age ?? '--'}</p>
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

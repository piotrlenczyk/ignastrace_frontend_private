import { useLocale, useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

import { localeFormatDate } from '../../../_page/utils';

const CrimeInformationComponent = ({
  className,
  sexOffenderData,
}: {
  className?: string;
  sexOffenderData: SexOffenderData;
}) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.crime_information');
  const tValues = useTranslations('pages.reverse_lookup.report.sex_offenders.report.values');

  return (
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      {!sexOffenderData.crime && <p className="text-gray-500">{t('no_information_available')}</p>}
      {sexOffenderData.crime && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-start gap-2 text-lg">
              <Icon name="alert-circle" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('crime')}</h5>
                <p>{sexOffenderData.crime || '--'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-lg">
              <Icon name="calendar" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('conviction_date')}</h5>
                <p>
                  {sexOffenderData.conviction_date ? localeFormatDate(sexOffenderData.conviction_date, locale) : '--'}
                </p>
              </div>
            </div>

            {/* Jurisdiction */}
            <div className="flex items-start gap-2 text-lg">
              <Icon name="pin-location" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('jurisdiction')}</h5>
                <p>{sexOffenderData.jurisdiction || '--'}</p>
              </div>
            </div>

            {/* Registration date */}
            <div className="flex items-start gap-2 text-lg">
              <Icon name="calendar" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('registration_date')}</h5>
                <p>
                  {sexOffenderData.registration_date
                    ? localeFormatDate(sexOffenderData.registration_date, locale)
                    : '--'}
                </p>
              </div>
            </div>

            {/* Risk level */}
            <div className="flex items-start gap-2 text-lg">
              <Icon name="shield" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('risk_level')}</h5>
                <p>{sexOffenderData.risk_level ? tValues(`risk_level.${sexOffenderData.risk_level}`) : '--'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
export default CrimeInformationComponent;

import { useLocale, useTranslations } from 'next-intl';

import { localeFormatDate } from '@/app/[locale]/memberarea/status/_page/utils';
import { useSexOffenderLabels } from '@/app/[locale]/memberarea/status/report/report-enum-labels';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SexOffenderSearchReport } from '@/server/getters/sex-offender-search.getters';

const CrimeInformationComponent = ({ className, record }: { className?: string; record: SexOffenderSearchReport }) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.crime_information');
  const label = useSexOffenderLabels();

  return (
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      {!record.crime && <p className="text-gray-500">{t('no_information_available')}</p>}
      {record.crime && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-start gap-2 text-lg">
              <Icon name="alert-circle" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('crime')}</h5>
                <p>{record.crime}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-lg">
              <Icon name="calendar" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('conviction_date')}</h5>
                <p>{record.convictionDate ? localeFormatDate(record.convictionDate, locale) : '--'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-lg">
              <Icon name="pin-location" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('jurisdiction')}</h5>
                <p>{record.jurisdiction || '--'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-lg">
              <Icon name="calendar" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('registration_date')}</h5>
                <p>{record.registrationDate ? localeFormatDate(record.registrationDate, locale) : '--'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-lg">
              <Icon name="shield" className="text-brand" />
              <div>
                <h5 className="font-bold">{t('risk_level')}</h5>
                <p>{record.riskLevel ? label.riskLevel(record.riskLevel) : '--'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
export default CrimeInformationComponent;

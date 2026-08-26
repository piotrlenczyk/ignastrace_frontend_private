import { useLocale, useTranslations } from 'next-intl';

import { localeFormatDate } from '@/app/[locale]/memberarea/status/_page/utils';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SexOffenderSearchReport } from '@/server/getters/sex-offender-search.getters';

const PersonalInformationComponent = ({
  className,
  record,
}: {
  className?: string;
  record: SexOffenderSearchReport;
}) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.personal_information');

  return (
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <Icon name="star" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('name')}</h5>
            <p>{record.name || '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="star" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('first_name_nicknames')}</h5>
            <p>{record.nickNames.length ? record.nickNames.join(', ') : '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <Icon name="calendar" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('date_of_birth')}</h5>
            <p>{record.dateOfBirth ? localeFormatDate(record.dateOfBirth, locale) : '--'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
export default PersonalInformationComponent;

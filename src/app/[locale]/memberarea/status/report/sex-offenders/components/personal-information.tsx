import { useLocale, useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { IconCalendarDates, IconStarLine } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

import { localeFormatDate } from '../../../_page/utils';

const PersonalInformationComponent = ({
  className,
  sexOffenderData,
}: {
  className?: string;
  sexOffenderData: SexOffenderData;
}) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.personal_information');

  return (
    <Card className={cn('p-6 shadow-raised border border-stroke-weak flex flex-col gap-8', className)}>
      <h4 className="font-bold">
        {t('title')}
      </h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <IconStarLine size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('name')}</h5>
            <p>{sexOffenderData.name || '--'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconStarLine size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('first_name_nicknames')}</h5>
            <p>
              {sexOffenderData.first_name_nick_names?.length ? sexOffenderData.first_name_nick_names.join(', ') : '--'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-lg">
          <IconCalendarDates size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('date_of_birth')}</h5>
            <p>{sexOffenderData.date_of_birth ? localeFormatDate(sexOffenderData.date_of_birth, locale) : '--'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
export default PersonalInformationComponent;

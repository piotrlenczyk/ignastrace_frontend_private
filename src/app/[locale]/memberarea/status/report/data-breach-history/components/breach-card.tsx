import { useLocale, useTranslations } from 'next-intl';

import { IconLockLine } from '@/components/ui/icon/icons';
import type { ReverseLookupDataLeak } from '@/types/reverse-lookup-data-leaks.types';

import { localeFormatDate } from '../../../_page/utils';

export const BreachCard = ({ breach }: { breach: ReverseLookupDataLeak }) => {
  const locale = useLocale();
  const t = useTranslations('pages.reverse_lookup.report.data_breach_history.report');

  return (
    <div className={`
      flex gap-3 rounded-lg border border-stroke-weak bg-white p-4
      print:border-none print:p-0 print:page-break-inside-avoid
    `}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary">
        <IconLockLine className="size-6 text-white" />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="mb-1 text-base font-semibold">{breach.service_name}</h3>
          <p className="text-sm text-weak">
            {localeFormatDate(breach.date, locale)}
          </p>
        </div>

        <p className="text-sm">
          {breach.description}
        </p>

        <p className="font-semibold">
          {t('compromised_data')}
          :
        </p>

        <ul className="list-disc pl-5 text-sm">
          {breach.compromised_data.map(data => (
            <li key={`${breach.service_name}-${data}`}>
              {t(`data_types.${data}`)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

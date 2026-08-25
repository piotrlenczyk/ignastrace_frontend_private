import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { useOwnerSourceLabel } from '../report-enum-labels';
import { AlertInfo } from './alert-info';

const PhonePublicInformation = ({ className, owners }: { className?: string; owners: SectionedReport['owners'] }) => {
  const t = useTranslations('pages.reverse_lookup.report.phone_public_information');
  const sourceLabel = useOwnerSourceLabel();

  const isEmpty = owners.length === 0;

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {!isEmpty && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          {owners.map((owner) => (
            <div key={owner.id} className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <span className="shrink-0">{t('source')}</span>
                    <strong className="break-words">{owner.source ? sourceLabel(owner.source) : ''}</strong>
                  </div>
                  <div className="flex gap-1">
                    <span className="shrink-0">
                      {t('name')} <strong>{owner.name}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PhonePublicInformation;

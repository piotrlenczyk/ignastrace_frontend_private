import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SexOffenderSearchReport } from '@/server/getters/sex-offender-search.getters';

const OthersInformationComponent = ({ className, record }: { className?: string; record: SexOffenderSearchReport }) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.others_information');

  return (
    <Card className={cn('flex flex-col gap-8 border border-stroke-weak p-6 shadow-raised', className)}>
      <h4 className="font-bold">{t('title')}</h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <Icon name="pin-location" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('jurisdiction')}</h5>
            <p>{record.jurisdiction || '--'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-lg">
          <Icon name="user" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('is_absconded')}</h5>
            <p>{record.isAbsconder ? t('yes') : '--'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-lg">
          <Icon name="user" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('is_predator')}</h5>
            <p>{record.isPredator ? t('yes') : '--'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-lg">
          <Icon name="open" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('original_report')}</h5>
            {record.originalSourceUrl ? (
              <a
                href={record.originalSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer text-primary underline"
              >
                {t('link')}
              </a>
            ) : (
              <p>--</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
export default OthersInformationComponent;

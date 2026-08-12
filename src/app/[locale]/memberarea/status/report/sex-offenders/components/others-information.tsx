import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { IconLinkExternal, IconLocationPinLine, IconUserAlert } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

const OthersInformationComponent = ({
  className,
  sexOffenderData,
}: {
  className?: string;
  sexOffenderData: SexOffenderData;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report.others_information');

  return (
    <Card className={cn('p-6 shadow-raised border border-stroke-weak flex flex-col gap-8', className)}>
      <h4 className="font-bold">
        {t('title')}
      </h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-2 text-lg">
          <IconLocationPinLine size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('jurisdiction')}</h5>
            <p>{sexOffenderData.jurisdiction || '--'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-lg">
          <IconUserAlert size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('is_absconded')}</h5>
            <p>{sexOffenderData.is_absconder ? t('yes') : '--'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-lg">
          <IconUserAlert size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('is_predator')}</h5>
            <p>{sexOffenderData.is_predator ? t('yes') : '--'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-lg">
          <IconLinkExternal size="large" className="text-brand" />
          <div>
            <h5 className="mb-0.5 font-bold">{t('original_report')}</h5>
            {sexOffenderData.original_source
              ? (
                  <a
                    href={sexOffenderData.original_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block cursor-pointer text-primary underline"
                  >
                    {t('link')}
                  </a>
                )
              : (
                  <p>--</p>
                )}
          </div>
        </div>
      </div>
    </Card>
  );
};
export default OthersInformationComponent;

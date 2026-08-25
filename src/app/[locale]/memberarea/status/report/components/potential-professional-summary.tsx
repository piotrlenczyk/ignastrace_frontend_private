import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { useJobLabel } from '../report-enum-labels';
import { AlertInfo } from './alert-info';

const PotentialProfessionalSummary = ({
  className,
  owners,
}: {
  className?: string;
  owners: SectionedReport['owners'];
}) => {
  const t = useTranslations('pages.reverse_lookup.report.potential_professional_summary');
  const jobLabel = useJobLabel();

  const jobs = owners.flatMap((owner) => owner.jobs);
  const isEmpty = jobs.length === 0;

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {jobs.map((job) => (
        <div key={job} className="flex items-center gap-2">
          <Icon name="briefcase" className="text-secondary" />
          <p className="text-lg font-bold">{jobLabel(job)}</p>
        </div>
      ))}
    </Card>
  );
};

export default PotentialProfessionalSummary;

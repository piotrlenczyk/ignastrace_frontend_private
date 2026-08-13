import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';

import { AlertInfo } from './alert-info';

const PotentialProfessionalSummary = ({
  className,
  reverseLookup,
}: {
  className?: string;
  reverseLookup: ReverseLookup;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.potential_professional_summary');

  const jobs = reverseLookup.reverse_lookup_owners
    .map((owner) => owner.jobs)
    .flat()
    .filter(Boolean);
  const isEmpty = jobs.length === 0;

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {jobs.map((item) => (
        <div key={item} className="flex items-center gap-2">
          <Icon name="briefcase" className="text-secondary" />
          <p className="text-lg font-bold">{item ? t(`values.${item}`) : ''}</p>
        </div>
      ))}
    </Card>
  );
};

export default PotentialProfessionalSummary;

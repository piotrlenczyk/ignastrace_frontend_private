import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { useEducationLabel } from '../report-enum-labels';
import { AlertInfo } from './alert-info';

const PotentialEducation = ({ className, owners }: { className?: string; owners: SectionedReport['owners'] }) => {
  const t = useTranslations('pages.reverse_lookup.report.potential_education');
  const educationLabel = useEducationLabel();

  const education = owners.flatMap((owner) => owner.education);

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">{education.length === 0 ? t('title_empty') : t('title')}</h4>

      <AlertInfo>{t('info')}</AlertInfo>

      {education.map((level) => (
        <div key={level} className="flex items-center gap-2">
          <Icon name="briefcase" className="text-secondary" />
          <p className="text-lg font-bold">{educationLabel(level)}</p>
        </div>
      ))}
    </Card>
  );
};

export default PotentialEducation;

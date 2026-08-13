import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { IconBriefcase } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';

import { AlertInfo } from './alert-info';

const PotentialEducation = ({ className, reverseLookup }: { className?: string; reverseLookup: ReverseLookup }) => {
  const t = useTranslations('pages.reverse_lookup.report.potential_education');

  const education = reverseLookup.reverse_lookup_owners.map(owner => owner.education).flat().filter(Boolean);

  return (
    <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
      <h4 className="font-bold">
        {education.length === 0 ? t('title_empty') : t('title')}
      </h4>

      <AlertInfo>
        {t('info')}
      </AlertInfo>

      {education.map(item => (
        <div key={item} className="flex items-center gap-2">
          <IconBriefcase size="large" className="text-secondary" />
          <p className="text-lg font-bold">
            {item ? t(`values.${item}`) : ''}
          </p>
        </div>
      ))}
    </Card>
  );
};

export default PotentialEducation;

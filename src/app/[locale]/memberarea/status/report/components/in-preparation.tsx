'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

/**
 * What a member sees in place of a report, or a sex-offender record, that the
 * backend has not finished putting together.
 *
 * One presentation for both, because the getters classify both upstream shapes —
 * a refusal on the sectioned read, a pending status on the record — as the same
 * outcome. It exists so that an unfinished report is not read as a finished
 * report with nothing in it, which is the one thing the empty state cannot say.
 *
 * The refresh is the whole affordance. Polling a report's progress properly is
 * the separate task ADR 0027 named, and it needs a failed-report state the
 * product does not have.
 */
export const InPreparation = ({ className }: { className?: string }) => {
  const t = useTranslations('__NEW__.reverse_lookup_report.in_preparation');
  const router = useRouter();

  return (
    <div className="p-4 lg:px-6">
      <Card
        className={cn(
          'flex flex-col items-center gap-4 border-stroke-weak px-4 py-10 text-center shadow-raised lg:px-6',
          className,
        )}
      >
        <Icon name="reload" className="size-8 animate-spin text-secondary duration-1000" />
        <h4 className="font-bold">{t('title')}</h4>
        <p className="text-weak">{t('description')}</p>
        <Button variant="secondary" onClick={() => router.refresh()}>
          <Icon name="reload" className="size-4" />
          {t('refresh')}
        </Button>
      </Card>
    </div>
  );
};

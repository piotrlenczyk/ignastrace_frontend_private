'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import AlertStatus from '@/components/ui/alert-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';
import type { User } from '@/types/user';

import { useConsumeUpsell } from '../_hooks/api/use-consume-upsell-mutation';
import DataBreachUpsell from './data-breach-upsell';

const DataBreachHistory = ({
  className,
  dataBreach,
  reportId,
  user,
}: {
  className?: string;
  dataBreach: SectionedReport['dataBreach'];
  reportId: string;
  user: User;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.data_breach_history');
  const router = useRouter();

  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [isConsumingUpsell, setIsConsumingUpsell] = useState(false);

  const breachCount = dataBreach.matchCount ?? 0;
  const hasBreaches = breachCount > 0;

  /*
   * The section's own state is the gate now, where a `…upsell_purchased` boolean
   * on the report used to be. Spending a credit is still the legacy call, so this
   * reads an unlock from one upstream that was written to another — the deliberate
   * asymmetry ADR 0028 records.
   */
  const isLocked = dataBreach.state === 'LOCKED';

  const { mutate: consumeUpsell } = useConsumeUpsell({
    onSuccess: () => {
      router.refresh();
      router.push(`${ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY}?id=${reportId}`);
    },
    onError: (error) => {
      console.error('Error consuming upsell', error);
      setIsConsumingUpsell(false);
    },
  });

  const handleUnlockClick = () => {
    if (user.purchase_info?.data_leaks_upsell_available) {
      setIsConsumingUpsell(true);
      consumeUpsell({ reverseLookupId: reportId, product: 'data_leaks' });
    } else {
      setShowUpsellDialog(true);
    }
  };

  const renderActionButton = () => {
    if (!hasBreaches) {
      return null;
    }

    if (!isLocked) {
      return (
        <div className="flex justify-end">
          <Button variant="secondary" asChild>
            <Link href={`${ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY}?id=${reportId}`}>{t('show_report')}</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <Button onClick={handleUnlockClick} disabled={isConsumingUpsell}>
          {isConsumingUpsell ? <Icon name="reload" className="size-4" /> : <Icon name="unlock" className="size-4" />}
          {t('unlock_report')}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
        <h4 className="font-bold">{t('title')}</h4>

        <AlertStatus
          title={t('alert_title', { count: breachCount })}
          description={hasBreaches ? t('alert_success') : t('alert_empty')}
          variant={hasBreaches ? 'warning' : undefined}
        />
        {renderActionButton()}
      </Card>

      <DataBreachUpsell open={showUpsellDialog} onOpenChange={setShowUpsellDialog} reportId={reportId} />
    </>
  );
};

export default DataBreachHistory;

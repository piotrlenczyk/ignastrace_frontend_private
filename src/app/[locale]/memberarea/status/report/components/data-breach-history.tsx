'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import AlertStatus from '@/components/ui/alert-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconLoaderCircle, IconLockOpenLine } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import type { User } from '@/types/user';

import { useConsumeUpsell } from '../_hooks/api/use-consume-upsell-mutation';
import DataBreachUpsell from './data-breach-upsell';

const DataBreachHistory = ({
  className,
  reverseLookup,
  user,
}: {
  className?: string;
  reverseLookup: ReverseLookup;
  user: User;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.data_breach_history');
  const router = useRouter();

  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [isConsumingUpsell, setIsConsumingUpsell] = useState(false);

  const breachCount = reverseLookup.reverse_lookup_data_leaks_count;
  const hasBreaches = breachCount > 0;
  const upsellPurchased = reverseLookup.reverse_lookup_data_leaks_upsell_purchased;

  const { mutate: consumeUpsell } = useConsumeUpsell({
    onSuccess: () => {
      router.refresh();
      router.push(`${ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY}?id=${reverseLookup.id}`);
    },
    onError: (error) => {
      console.error('Error consuming upsell', error);
      setIsConsumingUpsell(false);
    },
  });

  const handleUnlockClick = () => {
    if (user.purchase_info?.data_leaks_upsell_available) {
      setIsConsumingUpsell(true);
      consumeUpsell({ reverseLookupId: reverseLookup.id, product: 'data_leaks' });
    } else {
      setShowUpsellDialog(true);
    }
  };

  const renderActionButton = () => {
    if (!hasBreaches) {
      return null;
    }

    if (upsellPurchased) {
      return (
        <div className="flex justify-end">
          <Button variant="secondary" asChild>
            <Link href={`${ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY}?id=${reverseLookup.id}`}>
              {t('show_report')}
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <Button onClick={handleUnlockClick} disabled={isConsumingUpsell}>
          {isConsumingUpsell
            ? (
                <IconLoaderCircle className="size-4" />
              )
            : (
                <IconLockOpenLine className="size-4" />
              )}
          {t('unlock_report')}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
        <h4 className="font-bold">
          {t('title')}
        </h4>

        <AlertStatus
          title={t('alert_title', { count: breachCount })}
          description={hasBreaches ? t('alert_success') : t('alert_empty')}
          variant={hasBreaches ? 'warning' : undefined}
        />
        {renderActionButton()}
      </Card>

      <DataBreachUpsell
        open={showUpsellDialog}
        onOpenChange={setShowUpsellDialog}
        reportId={reverseLookup.id}
      />
    </>
  );
};

export default DataBreachHistory;

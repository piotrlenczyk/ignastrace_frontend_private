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
import { useUpsellUnlock } from '@/hooks/api/use-upsell-unlock';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { cn } from '@/libs/utils';
import { upsellCreditCount, useUpsellCreditsQuery } from '@/network/api/hooks/use-upsell-credits-query';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import DataBreachUpsell from './data-breach-upsell';

const DataBreachHistory = ({
  className,
  dataBreach,
  reportId,
}: {
  className?: string;
  dataBreach: SectionedReport['dataBreach'];
  reportId: string;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.data_breach_history');
  const router = useRouter();
  const showErrorToast = useGenericErrorToast();

  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [isSpendingCredit, setIsSpendingCredit] = useState(false);

  /*
   * Whether the member has a credit to spend, read from the new API's balances
   * rather than from the composed member's list of extras — which was a fixture
   * for this key, so the old gate always said yes. A
   * positive balance attempts the unlock outright; anything else offers the
   * purchase. ADR 0030 records the change.
   */
  const { data: creditBalances } = useUpsellCreditsQuery();
  const { spendCredit } = useUpsellUnlock();
  const hasCredit = upsellCreditCount(creditBalances, 'DATA_LEAKS') > 0;

  /*
   * A count the API did not state is not a count of zero.
   *
   * `matchCount` is declared optional and nullable, and the section it belongs to
   * is one the API withholds content from while it is `LOCKED` — as it withholds
   * the social section's accounts. So an absent count is read as "unknown" rather
   * than as "no breaches": reading it as zero would take the unlock button away
   * from exactly the member who has something to buy.
   */
  const breachCount = dataBreach.matchCount ?? 0;
  const countIsStated = dataBreach.matchCount !== null && dataBreach.matchCount !== undefined;
  const hasBreaches = breachCount > 0;
  const foundNothing = countIsStated && breachCount === 0;

  /*
   * The section's own state is the gate, where a `…upsell_purchased` boolean on
   * the report used to be. Since ADR 0030 the spend that changes it is written to
   * the same upstream this reads from, so the asymmetry ADR 0028 recorded here is
   * gone.
   */
  const isLocked = dataBreach.state === 'LOCKED';

  /*
   * A credit is spent where the balance says one is held, and the answer is the
   * settled one: the section is open, the balance turned out to be empty, or the
   * attempt failed. Only an empty balance opens the dialog, so a section that was
   * already unlocked is navigated to rather than offered for sale, and a failure
   * says so instead of reading as a sales pitch. No charge can follow from this
   * button either way: the price is quoted in the dialog before any money moves.
   * ADR 0031 records the inference behind the three answers.
   */
  const handleUnlockClick = async () => {
    if (!hasCredit) {
      setShowUpsellDialog(true);
      return;
    }

    setIsSpendingCredit(true);

    const outcome = await spendCredit({ product: 'DATA_LEAKS', reportId });

    setIsSpendingCredit(false);

    if (outcome === 'no-credit') {
      setShowUpsellDialog(true);
      return;
    }

    if (outcome === 'refused') {
      showErrorToast();
      return;
    }

    router.refresh();
    router.push(`${ROUTES.MEMBER.STATUS.DATA_BREACH_HISTORY}?id=${reportId}`);
  };

  const renderActionButton = () => {
    /* Only a zero the API actually stated hides the offer, which is what the
     * flag-based gate did with a count the legacy report always carried. */
    if (foundNothing) {
      return null;
    }

    if (!isLocked) {
      if (!hasBreaches) {
        return null;
      }

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
        <Button onClick={handleUnlockClick} disabled={isSpendingCredit}>
          {isSpendingCredit ? <Icon name="reload" className="size-4" /> : <Icon name="unlock" className="size-4" />}
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

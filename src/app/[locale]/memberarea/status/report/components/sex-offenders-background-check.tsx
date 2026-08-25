'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';
import type { User } from '@/types/user';

import { useConsumeUpsell } from '../_hooks/api/use-consume-upsell-mutation';
import { AlertInfo } from './alert-info';
import SexOffenderUpsell from './sex-offenders-upsell';

const SexOffendersBackgroundCheck = ({
  className,
  sexOffenders,
  owners,
  reportId,
  user,
}: {
  className?: string;
  sexOffenders: SectionedReport['sexOffenders'];
  owners: SectionedReport['owners'];
  reportId: string;
  user: User;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders_background_check');
  const router = useRouter();

  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [isConsumingUpsell, setIsConsumingUpsell] = useState(false);
  const [ownerId, setOwnerId] = useState<string>('');

  /*
   * This section is gated per owner, so the split is by which owners the member
   * has unlocked rather than by which records exist: an owner named in
   * `ownersWithRecords` is unlocked and gets a link, an owner absent from it is
   * locked and gets the unlock button. `found` says whether there is anything
   * behind the link — the negation of the legacy `is_empty_record` — and the
   * legacy screen linked to an empty record too, so it is not read here.
   *
   * Both branches now show the owner's name. The new API states no name on a
   * record and no identifier for one either, so the unlocked row shows what the
   * locked row always showed, and the two read consistently.
   */
  const { unlockedOwners, lockedOwners, isEmpty } = useMemo(() => {
    const unlockedIds = new Set((sexOffenders.ownersWithRecords ?? []).map((record) => record.ownerId));

    const unlocked = owners.filter((owner) => unlockedIds.has(owner.id));
    const locked = owners.filter((owner) => !unlockedIds.has(owner.id));

    return { unlockedOwners: unlocked, lockedOwners: locked, isEmpty: owners.length === 0 };
  }, [owners, sexOffenders.ownersWithRecords]);

  const { mutate: consumeUpsell } = useConsumeUpsell({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      console.error('Error consuming upsell', error);
      setIsConsumingUpsell(false);
    },
  });

  const handleUnlockClick = (unlockedOwnerId: string) => {
    setOwnerId(unlockedOwnerId);

    if (user.purchase_info?.sex_offenders_upsell_available) {
      setIsConsumingUpsell(true);
      consumeUpsell({ reverseLookupId: reportId, product: 'sex_offenders', ownerId: unlockedOwnerId });
    } else {
      setShowUpsellDialog(true);
    }
  };

  return (
    <>
      <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-bold">{isEmpty ? t('title_empty') : t('title')}</h4>
          <Image src="/images/reverse-lookup/icon-sex-offenders.svg" alt={t('alt_icon')} width={32} height={32} />
        </div>

        <AlertInfo>{t('info')}</AlertInfo>

        <div className="relative flex flex-col gap-4">
          {unlockedOwners.map((owner) => (
            <div key={owner.id} className="flex items-center justify-between">
              <strong className="text-lg">{owner.name}</strong>
              <Button variant="secondary" className="shrink-0" asChild>
                <Link href={`${ROUTES.MEMBER.STATUS.SEX_OFFENDERS}?reportId=${reportId}&ownerId=${owner.id}`}>
                  {t('show_report')}
                </Link>
              </Button>
            </div>
          ))}
          {lockedOwners.map((owner) => (
            <div key={owner.id} className="flex items-center justify-between">
              <strong className="text-lg">{owner.name}</strong>
              <Button onClick={() => handleUnlockClick(owner.id)} disabled={isConsumingUpsell}>
                {isConsumingUpsell && ownerId === owner.id ? (
                  <Icon name="reload" className="size-4" />
                ) : (
                  <Icon name="unlock" className="size-4" />
                )}
                {t('unlock_report')}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <SexOffenderUpsell
        open={showUpsellDialog}
        onOpenChange={setShowUpsellDialog}
        reportId={reportId}
        ownerId={ownerId}
      />
    </>
  );
};

export default SexOffendersBackgroundCheck;

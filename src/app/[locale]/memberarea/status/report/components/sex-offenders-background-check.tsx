'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconLoaderCircle, IconLockOpenLine } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/libs/utils';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import type { User } from '@/types/user';

import { useConsumeUpsell } from '../_hooks/api/use-consume-upsell-mutation';
import { AlertInfo } from './alert-info';
import SexOffenderUpsell from './sex-offenders-upsell';

const SexOffendersBackgroundCheck = ({
  className,
  reverseLookup,
  user,
}: {
  className?: string;
  reverseLookup: ReverseLookup;
  user: User;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders_background_check');
  const router = useRouter();

  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [isConsumingUpsell, setIsConsumingUpsell] = useState(false);
  const [ownerId, setOwnerId] = useState<string>('');

  const { createdReports, lockedReports, isEmpty } = useMemo(() => {
    const reportedOwnerIds = new Set(
      reverseLookup.sex_offender_reports.map((report) => report.reverse_lookup_owner_id),
    );

    const locked = reverseLookup.reverse_lookup_owners.filter((owner) => !reportedOwnerIds.has(owner.id));

    const created = reverseLookup.sex_offender_reports;

    return {
      createdReports: created,
      lockedReports: locked,
      isEmpty: created.length === 0 && locked.length === 0,
    };
  }, [reverseLookup]);

  const { mutate: consumeUpsell } = useConsumeUpsell({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      console.error('Error consuming upsell', error);
      setIsConsumingUpsell(false);
    },
  });

  const handleUnlockClick = (ownerId: string) => {
    setOwnerId(ownerId);

    if (user.purchase_info?.sex_offenders_upsell_available) {
      setIsConsumingUpsell(true);
      consumeUpsell({ reverseLookupId: reverseLookup.id, product: 'sex_offenders', ownerId });
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
          {createdReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between">
              <strong className="text-lg">{report.name}</strong>
              <Button variant="secondary" className="shrink-0" asChild>
                <Link href={`${ROUTES.MEMBER.STATUS.SEX_OFFENDERS}?id=${report.id}`}>{t('show_report')}</Link>
              </Button>
            </div>
          ))}
          {lockedReports.map((owner) => (
            <div key={owner.id} className="flex items-center justify-between">
              <strong className="text-lg">{owner.name}</strong>
              <Button onClick={() => handleUnlockClick(owner.id)} disabled={isConsumingUpsell}>
                {isConsumingUpsell && ownerId === owner.id ? (
                  <IconLoaderCircle className="size-4" />
                ) : (
                  <IconLockOpenLine className="size-4" />
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
        reportId={reverseLookup.id}
        ownerId={ownerId}
      />
    </>
  );
};

export default SexOffendersBackgroundCheck;

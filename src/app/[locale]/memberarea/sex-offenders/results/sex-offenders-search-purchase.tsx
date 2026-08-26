'use client';

import { useState } from 'react';

import UpsellDialog from '@/app/[locale]/memberarea/status/report/components/upsell-dialog';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';

type SexOffenderSearchPurchaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchId: string;
  candidateIndex: number;
};

/**
 * Unlocking one candidate of a standalone search.
 *
 * The same dialog, the same sequence and the same payment message every other
 * upselling uses since ADR 0039 — spend a credit, and buy one first only where a
 * fresh balance says there is nothing to spend. What was here before was a
 * bespoke dialog around a legacy purchase, kept because that purchase also
 * created the search report and answered with its identifier. The new API's spend
 * answers with it, so there is nothing left for a second dialog to do.
 *
 * **One path unlocks and cannot navigate.** Where the spend conflicted and the
 * balance settled it as "already open", nothing was spent, so no report was
 * materialised and none is named — and the new API publishes no way to recover a
 * search report's identifier after the fact: no list of searches, no list of
 * reports, no unlocked flag on a candidate. The member is told the content is
 * open and stays on the candidate list. ADR 0039 records that as a finding rather
 * than working around it with client-side storage that lies once a browser is
 * cleared.
 */
export const SexOffenderSearchPurchase = ({
  open,
  onOpenChange,
  searchId,
  candidateIndex,
}: SexOffenderSearchPurchaseProps) => {
  const router = useRouter();
  const [searchReportId, setSearchReportId] = useState<string>();

  return (
    <UpsellDialog
      open={open}
      onOpenChange={onOpenChange}
      productKey="sex_offenders_search"
      translationNamespace="pages.reverse_lookup.report.upsell.sex_offenders_search"
      benefitKeys={['instant_access', 'verified_source_data', 'secure_one_time_payment']}
      spendRequest={{ product: 'SEX_OFFENDERS_SEARCH', searchId, candidateIndex }}
      onUnlocked={setSearchReportId}
      onSuccessClose={() => {
        if (searchReportId) {
          router.push(`${ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.REPORT}?id=${searchReportId}`);
        }
      }}
    />
  );
};

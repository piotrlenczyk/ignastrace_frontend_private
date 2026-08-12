'use client';

import { useState } from 'react';

import UpsellDialog from '@/app/[locale]/memberarea/status/report/components/upsell-dialog';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';

type SexOffenderSearchPurchaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sexOffenderSearchId: string;
  candidateIndex: number;
};

export const SexOffenderSearchPurchase = ({
  open,
  onOpenChange,
  sexOffenderSearchId,
  candidateIndex,
}: SexOffenderSearchPurchaseProps) => {
  const router = useRouter();
  const [reportId, setReportId] = useState<string | null>(null);

  return (
    <UpsellDialog
      open={open}
      onOpenChange={onOpenChange}
      productKey="sex_offenders_search"
      translationNamespace="pages.reverse_lookup.report.upsell.sex_offenders_search"
      benefitKeys={[
        'instant_access',
        'verified_source_data',
        'secure_one_time_payment',
      ]}
      purchaseParams={{
        sexOffenderSearchId,
        candidateIndex,
      }}
      onPurchaseSuccess={(data) => {
        if (data?.sex_offender_search_report_id) {
          setReportId(data.sex_offender_search_report_id);
        }
      }}
      onSuccessClose={() => {
        if (reportId) {
          router.push(`${ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.REPORT}?id=${reportId}`);
        }
      }}
    />
  );
};

'use client';

import { useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';

import { SexOffenderSearchDialog } from './sex-offender-search-dialog';

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
    <SexOffenderSearchDialog
      open={open}
      onOpenChange={onOpenChange}
      translationNamespace="pages.reverse_lookup.report.upsell.sex_offenders_search"
      benefitKeys={['instant_access', 'verified_source_data', 'secure_one_time_payment']}
      sexOffenderSearchId={sexOffenderSearchId}
      candidateIndex={candidateIndex}
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

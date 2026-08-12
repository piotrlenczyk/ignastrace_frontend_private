'use client';

import UpsellDialog from './upsell-dialog';

type SexOffendersUpsellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  ownerId: string;
};

const SexOffenderUpsell = ({ open, onOpenChange, reportId, ownerId }: SexOffendersUpsellProps) => {
  return (
    <UpsellDialog
      open={open}
      onOpenChange={onOpenChange}
      productKey="sex_offenders"
      translationNamespace="pages.reverse_lookup.report.upsell.sex_offenders"
      benefitKeys={[
        'instant_nationwide_search',
        'comprehensive_data',
        'realtime_verification',
      ]}
      purchaseParams={{
        reverseLookupId: reportId,
        ownerId,
      }}
    />
  );
};

export default SexOffenderUpsell;

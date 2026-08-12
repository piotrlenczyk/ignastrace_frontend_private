'use client';

import UpsellDialog from './upsell-dialog';

type DataBreachUpsellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
};

const DataBreachUpsell = ({ open, onOpenChange, reportId }: DataBreachUpsellProps) => {
  return (
    <UpsellDialog
      open={open}
      onOpenChange={onOpenChange}
      productKey="data_leaks"
      translationNamespace="pages.reverse_lookup.report.upsell.data_breach_history"
      benefitKeys={[
        'personal_identifiers',
        'compromise_isa_contact_details',
        'professional_information_and_technical_data',
      ]}
      purchaseParams={{ reverseLookupId: reportId }}
      paymentMessageReportId={reportId}
    />
  );
};

export default DataBreachUpsell;

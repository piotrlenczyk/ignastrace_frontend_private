'use client';

import UpsellDialog from './upsell-dialog';

type UnlimitedDownloadsUpsellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPdf?: () => Promise<void>;
};

const UnlimitedDownloadsUpsell = ({ open, onOpenChange, onDownloadPdf }: UnlimitedDownloadsUpsellProps) => {
  return (
    <UpsellDialog
      open={open}
      onOpenChange={onOpenChange}
      onDownloadPdf={onDownloadPdf}
      productKey="unlimited_pdf_downloads"
      translationNamespace="pages.reverse_lookup.report.upsell.unlimited_pdf_downloads"
      benefitKeys={[
        'upsell_benefits_1',
        'upsell_benefits_2',
        'upsell_benefits_3',
        'upsell_benefits_4',
      ]}
    />
  );
};

export default UnlimitedDownloadsUpsell;

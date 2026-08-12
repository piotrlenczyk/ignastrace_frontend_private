'use client';

import { useTranslations } from 'next-intl';

import { usePdfDownload } from '@/hooks/use-pdf-download';
import type { User } from '@/types/user';

import { DownloadReportButton } from './download-report-button';

const DownloadPdfButton = ({ user }: { user: User }) => {
  const t = useTranslations('pages.reverse_lookup.report');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available ?? false;

  const handleDownload = () => {
    return downloadPdf(window.location.href, 'mobitrace-report.pdf');
  };

  return (
    <div id="bottom-download-button" className="lg:hidden">
      <DownloadReportButton
        hasUnlimitedDownloads={hasUnlimitedDownloads}
        isGenerating={isGenerating}
        onDownload={handleDownload}
        buttonText={t('header.button')}
      />
    </div>
  );
};

export default DownloadPdfButton;

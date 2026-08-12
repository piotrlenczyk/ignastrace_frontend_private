'use client';

import { useTranslations } from 'next-intl';

import { usePdfDownload } from '@/hooks/use-pdf-download';
import type { User } from '@/types/user';

import StickyDownloadButton from './sticky-download-button';

const StickyDownloadPdfButton = ({ user }: { user: User }) => {
  const t = useTranslations('pages.reverse_lookup.report');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available ?? false;

  const handleDownload = () => {
    return downloadPdf(window.location.href, 'mobitrace-report.pdf');
  };

  return (
    <StickyDownloadButton
      hasUnlimitedDownloads={hasUnlimitedDownloads}
      isGenerating={isGenerating}
      onDownload={handleDownload}
      buttonText={t('header.button')}
    />
  );
};

export default StickyDownloadPdfButton;

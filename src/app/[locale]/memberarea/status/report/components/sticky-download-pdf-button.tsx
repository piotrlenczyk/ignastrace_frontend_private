'use client';

import { useTranslations } from 'next-intl';

import { usePdfDownload } from '@/hooks/use-pdf-download';
import type { schemas } from '@/network/api/apiServerClient';

import StickyDownloadButton from './sticky-download-button';

const StickyDownloadPdfButton = ({ user }: { user: schemas['UserResponse'] }) => {
  const t = useTranslations('pages.reverse_lookup.report');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.unlimitedPdfDownloadsUnlocked;

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

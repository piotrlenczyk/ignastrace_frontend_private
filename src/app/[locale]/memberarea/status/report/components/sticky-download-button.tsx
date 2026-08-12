'use client';

import { useEffect, useState } from 'react';

import { DownloadReportButton } from './download-report-button';

type StickyDownloadButtonProps = {
  hasUnlimitedDownloads: boolean;
  isGenerating: boolean;
  onDownload: () => Promise<void>;
  buttonText: string;
};

const StickyDownloadButton = ({
  hasUnlimitedDownloads,
  isGenerating,
  onDownload,
  buttonText,
}: StickyDownloadButtonProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let headerVisible = true;
    let bottomVisible = false;

    const updateVisibility = () => {
      setVisible(!headerVisible && !bottomVisible);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target.id === 'header-download-button') {
          headerVisible = entry.isIntersecting;
        } else if (entry.target.id === 'bottom-download-button') {
          bottomVisible = entry.isIntersecting;
        }
      }
      updateVisibility();
    });

    const headerEl = document.getElementById('header-download-button');
    const bottomEl = document.getElementById('bottom-download-button');

    if (headerEl) {
      observer.observe(headerEl);
    }
    if (bottomEl) {
      observer.observe(bottomEl);
    }

    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-14 left-1/2 z-50 -translate-x-1/2 lg:hidden print:hidden">
      <DownloadReportButton
        hasUnlimitedDownloads={hasUnlimitedDownloads}
        isGenerating={isGenerating}
        onDownload={onDownload}
        buttonText={buttonText}
        className="text-sm! shadow-lg print:hidden"
      />
    </div>
  );
};

export default StickyDownloadButton;

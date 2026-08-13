'use client';

import UnlockUnlimitedDownloads from '@/components/reverse-lookup/unlock-unlimited-downloads';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

type DownloadReportButtonProps = {
  hasUnlimitedDownloads: boolean;
  isGenerating: boolean;
  onDownload: () => Promise<void>;
  buttonText: string;
  className?: string;
};

export const DownloadReportButton = ({
  hasUnlimitedDownloads,
  isGenerating,
  onDownload,
  buttonText,
  className = 'w-full text-sm! lg:w-auto print:hidden',
}: DownloadReportButtonProps) => {
  return hasUnlimitedDownloads ? (
    <Button className={className} onClick={onDownload} disabled={isGenerating}>
      {isGenerating ? <Icon name="reload" className="size-4" /> : <Icon name="download" className="size-4" />}
      {buttonText}
    </Button>
  ) : (
    <UnlockUnlimitedDownloads className={className} onDownloadPdf={onDownload} />
  );
};

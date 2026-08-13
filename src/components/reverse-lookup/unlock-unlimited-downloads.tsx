import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import UnlimitedDownloadsUpsell from '@/app/[locale]/memberarea/status/report/components/unlimited-downloads-upsell';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

import { Button } from '../ui/button';

type UnlockUnlimitedDownloadsProps = {
  className?: string;
  size?: 'md' | 'lg';
  variant?: 'default' | 'outline-secondary' | 'secondary';
  onDownloadPdf: () => Promise<void>;
};

const UnlockUnlimitedDownloads = ({
  className,
  size = 'md',
  variant = 'default',
  onDownloadPdf,
}: UnlockUnlimitedDownloadsProps) => {
  const t = useTranslations('pages.reverse_lookup.report.header');
  const router = useRouter();
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const iconSize = size === 'md' ? 'size-4' : 'size-6';

  const handleUnlockClick = () => {
    setShowUpsellDialog(true);
  };

  const handleDownloadPdf = async () => {
    setShowUpsellDialog(false);
    setIsDownloading(true);
    await onDownloadPdf();
    router.refresh();
  };

  return (
    <>
      <Button
        size={size}
        onClick={handleUnlockClick}
        variant={isDownloading ? variant : 'default'}
        className={cn(className, isDownloading ? 'gap-0 px-3' : 'gap-2')}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            <Icon name="reload" className="size-4" />
            <span className="px-1">{t('button')}</span>
          </>
        ) : (
          <>
            <Icon name="unlock" className={iconSize} />
            {t('unlock_download_pdf')}
          </>
        )}
      </Button>

      <UnlimitedDownloadsUpsell
        open={showUpsellDialog}
        onOpenChange={setShowUpsellDialog}
        onDownloadPdf={handleDownloadPdf}
      />
    </>
  );
};

export default UnlockUnlimitedDownloads;

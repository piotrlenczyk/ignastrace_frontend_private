'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import UnlockUnlimitedDownloads from '@/components/reverse-lookup/unlock-unlimited-downloads';
import { Button } from '@/components/ui/button';
import { IconDownload, IconLoaderCircle } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { usePdfDownload } from '@/hooks/use-pdf-download';
import { cn } from '@/libs/utils';
import type { User } from '@/types/user';

type ReportReadyProps = {
  className?: string;
  user: User;
};

export const ReportReady = ({ className, user }: ReportReadyProps) => {
  const t = useTranslations('pages.reverse_lookup.components.report_ready');
  const router = useRouter();
  const id = useSearchParams().get('id');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available;

  const handleViewReport = () => {
    router.push(`${ROUTES.MEMBER.STATUS.REPORT}?id=${id}`);
  };

  const handleDownloadReport = () => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${ROUTES.MEMBER.STATUS.REPORT}?id=${id}`;
    return downloadPdf(fullUrl, 'mobitrace-report.pdf');
  };

  return (
    <div className={cn('mt-4 rounded-2xl bg-alternate p-4 sm:px-8', className)}>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          {t('description')}
        </div>
        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:shrink-0 sm:flex-row">
          {hasUnlimitedDownloads
            ? (
                <Button
                  className="order-2 w-full rounded-lg text-base sm:order-1 sm:w-auto"
                  onClick={handleDownloadReport}
                  disabled={isGenerating}
                >
                  {isGenerating
                    ? (
                        <IconLoaderCircle className="size-4" />
                      )
                    : (
                        <IconDownload className="size-4" />
                      )}

                  <span className="px-1">{t('download_report_button')}</span>
                </Button>
              )
            : (
                <UnlockUnlimitedDownloads
                  className="order-2 min-h-10! w-full text-base! sm:order-1 sm:w-auto"
                  variant="secondary"
                  onDownloadPdf={handleDownloadReport}
                />
              )}
          <Button
            variant="outline-secondary"
            className="order-1 w-full rounded-lg text-base sm:order-2 sm:w-auto"
            onClick={handleViewReport}
          >
            {t('view_report_button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

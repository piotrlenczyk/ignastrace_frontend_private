'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconCheckCircle } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { usePdfDownload } from '@/hooks/use-pdf-download';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import type { User } from '@/types/user';

import { DownloadReportButton } from './download-report-button';

const ReportHeader = ({ reverseLookup, user }: { reverseLookup: ReverseLookup; user: User }) => {
  const t = useTranslations('pages.reverse_lookup.report.header');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const phoneNumberFormatted = formatPhoneNumber(reverseLookup.phone);
  const photo = reverseLookup.reverse_lookup_photos[0]?.content;
  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available ?? false;

  const handleDownload = () => {
    return downloadPdf(window.location.href, 'mobitrace-report.pdf');
  };

  return (
    <>
      <div
        className={`
          top-0 z-10 flex items-center justify-between gap-2 bg-white px-4 pt-2 pb-4
          lg:sticky lg:rounded-t-lg lg:p-6
          print:hidden
        `}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex size-12 items-center gap-2" asChild>
            <Link href={`${ROUTES.MEMBER.STATUS.HOME}`}>
              <IconArrowLeft size="large" className="text-neutral" />
            </Link>
          </Button>
          <h4 className="h4 font-bold">{t('title')}</h4>
        </div>
        <div className="hidden lg:block">
          <DownloadReportButton
            hasUnlimitedDownloads={hasUnlimitedDownloads}
            isGenerating={isGenerating}
            onDownload={handleDownload}
            buttonText={t('button')}
          />
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <div className="mb-4 flex flex-col gap-4 lg:mb-0 lg:flex-row lg:items-center lg:gap-5">
          <div className="flex items-center gap-6">
            {photo && (
              <Image className="size-[60px] rounded-xl object-cover" src={photo} alt="photo" width={60} height={60} />
            )}

            <div className="flex w-full flex-col">
              <div className="flex items-center gap-1">
                <IconCheckCircle className="size-5 text-secondary" />
                <p className="text-caption text-weak">{t('matches_found')}</p>
              </div>
              <h3 className="mt-1 font-bold lg:mt-2">{phoneNumberFormatted.number}</h3>
            </div>
          </div>
        </div>
        <div id="header-download-button" className="lg:hidden">
          <DownloadReportButton
            hasUnlimitedDownloads={hasUnlimitedDownloads}
            isGenerating={isGenerating}
            onDownload={handleDownload}
            buttonText={t('button')}
          />
        </div>
      </div>
    </>
  );
};

export default ReportHeader;

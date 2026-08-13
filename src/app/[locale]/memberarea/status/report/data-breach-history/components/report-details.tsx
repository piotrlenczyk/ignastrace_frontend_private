'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  IconArrowLeft,
  IconCheckCircle,
} from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { usePdfDownload } from '@/hooks/use-pdf-download';
import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';
import type { ReverseLookupDataLeak } from '@/types/reverse-lookup-data-leaks.types';
import type { User } from '@/types/user';

import { DownloadReportButton } from '../../components/download-report-button';
import StickyDownloadButton from '../../components/sticky-download-button';
import { BreachCard } from './breach-card';

export const ReportDetails = ({ user, reverseLookupDataLeaks, photo, phone, reverseLookupId }: {
  user: User;
  reverseLookupDataLeaks: ReverseLookupDataLeak[];
  photo?: string;
  phone: string;
  reverseLookupId: string;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.data_breach_history.report');

  const { downloadPdf, isGenerating } = usePdfDownload();

  const { number: formattedPhoneNumber } = usePhoneNumberFormatter(phone);

  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available ?? false;

  const handleDownloadReport = () => {
    return downloadPdf(window.location.href, 'mobitrace-data-breach-history.pdf');
  };

  return (
    <section>
      <div className={`
        top-0 z-10 flex items-center justify-between gap-2 bg-white px-4 pt-2 pb-4
        lg:sticky lg:rounded-t-lg lg:p-6
        print:hidden
      `}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex size-12 items-center gap-2"
            asChild
          >
            <Link href={`${ROUTES.MEMBER.STATUS.REPORT}?id=${reverseLookupId}`}>
              <IconArrowLeft size="large" className="text-neutral" />
            </Link>
          </Button>
          <h1 className="h4 font-bold">
            {t('title')}
          </h1>
        </div>
        <div className="hidden lg:block">
          <DownloadReportButton
            hasUnlimitedDownloads={hasUnlimitedDownloads}
            isGenerating={isGenerating}
            onDownload={handleDownloadReport}
            buttonText={t('download_report_button')}
          />
        </div>
      </div>

      <div className="px-4 lg:px-6 lg:pb-6">
        <div className="mb-4 flex items-center gap-6">
          {photo && (
            <Image
              src={photo}
              alt="avatar"
              className="size-[60px] rounded-xl object-cover"
              width={60}
              height={60}
            />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-caption text-weak">
              <IconCheckCircle className="size-5 text-secondary" />
              {' '}
              {t('breaches_found_for')}
            </p>
            <span className="h3 font-bold">{formattedPhoneNumber}</span>
          </div>
        </div>

        <div id="header-download-button" className="mb-4 lg:hidden">
          <DownloadReportButton
            hasUnlimitedDownloads={hasUnlimitedDownloads}
            isGenerating={isGenerating}
            onDownload={handleDownloadReport}
            buttonText={t('download_report_button')}
          />
        </div>

        <div className="flex flex-col gap-4">
          {reverseLookupDataLeaks.map(breach => (
            <BreachCard key={breach.id} breach={breach} />
          ))}
        </div>

        <div id="bottom-download-button" className="my-4 lg:hidden">
          <DownloadReportButton
            hasUnlimitedDownloads={hasUnlimitedDownloads}
            isGenerating={isGenerating}
            onDownload={handleDownloadReport}
            buttonText={t('download_report_button')}
          />
        </div>
      </div>
      <StickyDownloadButton
        hasUnlimitedDownloads={hasUnlimitedDownloads}
        isGenerating={isGenerating}
        onDownload={handleDownloadReport}
        buttonText={t('download_report_button')}
      />
    </section>
  );
};

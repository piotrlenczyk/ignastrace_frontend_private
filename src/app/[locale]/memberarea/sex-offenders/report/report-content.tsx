'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { DownloadReportButton } from '@/app/[locale]/memberarea/status/report/components/download-report-button';
import StickyDownloadButton from '@/app/[locale]/memberarea/status/report/components/sticky-download-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { usePdfDownload } from '@/hooks/use-pdf-download';
import { Link } from '@/libs/i18n-routing';
import type { schemas } from '@/network/api/apiServerClient';
import type { SexOffenderSearchReport } from '@/server/getters/sex-offender-search.getters';

import AddressInformation from './components/address-information';
import BodyCharacteristics from './components/body-characteristics';
import CrimeInformation from './components/crime-information';
import OthersInformation from './components/others-information';
import PersonalInformation from './components/personal-information';
import Photos from './components/photos';

/*
 * Six cards where there were seven. **Distinguishing marks is gone.** ADR 0028
 * kept it on this screen on the stated grounds that its upstream populated the
 * marks; the new API types them as an always-null object and documents that no
 * provider it ships writes one. So the card had nothing left to render, and ADR
 * 0039 records the contradiction as a finding rather than keeping nine empty rows
 * on the screen.
 */
export const SexOffenderSearchReportContent = ({
  record,
  user,
}: {
  record: SexOffenderSearchReport;
  user: schemas['UserResponse'];
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.unlimitedPdfDownloadsUnlocked;

  const handleDownloadReport = () => {
    return downloadPdf(window.location.href, 'mobitrace-sex-offenders.pdf');
  };

  const photo = record.photos[0];

  return (
    <main>
      <div
        className={`
          top-0 z-10 flex items-center justify-between gap-2 bg-white px-4 pt-2 pb-4
          lg:sticky lg:rounded-t-lg lg:p-6
          print:hidden
        `}
      >
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label={t('new_search')}>
            <Link href={ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME}>
              <Icon name="arrow-left" />
            </Link>
          </Button>
          <h1 className="h4 font-bold">{t('title_profile')}</h1>
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
              className="size-[60px] rounded-xl object-cover"
              src={photo}
              alt="user avatar"
              width={60}
              height={60}
            />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-sm text-weak">
              <Icon name="check-circle" className="mr-1 size-5 text-secondary" />
              {t('records_found_for')}
            </p>
            <span className="h3 font-bold">{record.name || '--'}</span>
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
          <PersonalInformation record={record} />
          <BodyCharacteristics record={record} />
          <CrimeInformation record={record} />
          <AddressInformation record={record} />
          <Photos record={record} />
          <OthersInformation record={record} />
          <div id="bottom-download-button" className="mb-4 lg:hidden">
            <DownloadReportButton
              hasUnlimitedDownloads={hasUnlimitedDownloads}
              isGenerating={isGenerating}
              onDownload={handleDownloadReport}
              buttonText={t('download_report_button')}
            />
          </div>
        </div>
      </div>
      <StickyDownloadButton
        hasUnlimitedDownloads={hasUnlimitedDownloads}
        isGenerating={isGenerating}
        onDownload={handleDownloadReport}
        buttonText={t('download_report_button')}
      />
    </main>
  );
};

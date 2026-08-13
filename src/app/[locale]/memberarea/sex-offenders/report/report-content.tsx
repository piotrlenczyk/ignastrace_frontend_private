'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { DownloadReportButton } from '@/app/[locale]/memberarea/status/report/components/download-report-button';
import StickyDownloadButton from '@/app/[locale]/memberarea/status/report/components/sticky-download-button';
import AddressInformation from '@/app/[locale]/memberarea/status/report/sex-offenders/components/address-information';
import BodyCharacteristics from '@/app/[locale]/memberarea/status/report/sex-offenders/components/body-characteristics';
import CrimeInformation from '@/app/[locale]/memberarea/status/report/sex-offenders/components/crime-information';
import DistinctiveFeatures from '@/app/[locale]/memberarea/status/report/sex-offenders/components/distinctive-features';
import OthersInformation from '@/app/[locale]/memberarea/status/report/sex-offenders/components/others-information';
import PersonalInformation from '@/app/[locale]/memberarea/status/report/sex-offenders/components/personal-information';
import Photos from '@/app/[locale]/memberarea/status/report/sex-offenders/components/photos';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconCheckCircle } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { usePdfDownload } from '@/hooks/use-pdf-download';
import { Link } from '@/libs/i18n-routing';
import type { SexOffenderData } from '@/types/sex-offenders.types';
import type { User } from '@/types/user';

export const SexOffenderSearchReportContent = ({
  sexOffenderData,
  user,
}: {
  sexOffenderData: SexOffenderData;
  user: User;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available ?? false;

  const handleDownloadReport = () => {
    return downloadPdf(window.location.href, 'mobitrace-sex-offenders.pdf');
  };

  const photo = sexOffenderData.reverse_lookup_photos[0]?.content;

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
              <IconArrowLeft />
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
              <IconCheckCircle className="mr-1 size-5 text-secondary" />
              {t('records_found_for')}
            </p>
            <span className="h3 font-bold">{sexOffenderData.name}</span>
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
          <PersonalInformation sexOffenderData={sexOffenderData} />
          <BodyCharacteristics sexOffenderData={sexOffenderData} />
          <DistinctiveFeatures sexOffenderData={sexOffenderData} />
          <CrimeInformation sexOffenderData={sexOffenderData} />
          <AddressInformation sexOffenderData={sexOffenderData} />
          <Photos sexOffenderData={sexOffenderData} />
          <OthersInformation sexOffenderData={sexOffenderData} />
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

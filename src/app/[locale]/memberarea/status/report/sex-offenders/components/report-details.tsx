'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconCheckCircle } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { usePdfDownload } from '@/hooks/use-pdf-download';
import type { SexOffenderData } from '@/types/sex-offenders.types';
import type { User } from '@/types/user';

import { DownloadReportButton } from '../../components/download-report-button';
import StickyDownloadButton from '../../components/sticky-download-button';
import AddressInformation from './address-information';
import BodyCharacteristics from './body-characteristics';
import CrimeInformation from './crime-information';
import DistinctiveFeatures from './distinctive-features';
import OthersInformation from './others-information';
import PersonalInformationComponent from './personal-information';
import Photos from './photos';

export const ReportDetails = ({ sexOffenderData, user }: { user: User; sexOffenderData: SexOffenderData }) => {
  const t = useTranslations('pages.reverse_lookup.report.sex_offenders.report');
  const { downloadPdf, isGenerating } = usePdfDownload();

  const hasUnlimitedDownloads = user.purchase_info?.unlimited_downloads_upsell_available ?? false;

  const handleDownloadReport = () => {
    return downloadPdf(window.location.href, 'mobitrace-sex-offenders.pdf');
  };

  const photo = sexOffenderData.reverse_lookup_photos[0]?.content;

  return (
    <section>
      <div
        className={`
          top-0 z-10 flex items-center justify-between gap-2 bg-white px-4 pt-2 pb-4
          lg:sticky lg:rounded-t-lg lg:p-6
          print:hidden
        `}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex size-12 items-center gap-2">
            <Link href={`${ROUTES.MEMBER.STATUS.REPORT}?id=${sexOffenderData.reverse_lookup_id}`}>
              <IconArrowLeft size="large" className="text-neutral" />
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
          <PersonalInformationComponent sexOffenderData={sexOffenderData} />
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
    </section>
  );
};

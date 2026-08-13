'use client';
import { useTranslations } from 'next-intl';
import React from 'react';

import AvatarWithLock from '@/components/reverse-lookup/avatar-with-lock';

import { useSummaryReport } from './hooks/use-summary-report';
import { CallerInfo, ReportHeader, ResultsList, TrustSection, UserInfo } from './summary-report-subcomponents';
import TimerSection from './timer-section';
import type { SummaryReportProps } from './types/summary-report.types';

const SummaryReportCard: React.FC<SummaryReportProps> = ({ phoneNumber }) => {
  const t = useTranslations('pages.reverse_lookup.components.summary_report_card');
  const { phoneNumberFormatted, carrierResponse, formattedLineType } = useSummaryReport(phoneNumber);

  const title = t.rich('title', {
    phoneNumber: phoneNumberFormatted.number,
    mark: (chunks) => <mark className="whitespace-nowrap text-brand">{chunks}</mark>,
  });

  return (
    <section className="mx-4 rounded-lg border border-warning-stroke bg-warning-fill px-4 lg:mx-0 lg:px-6">
      <TimerSection />
      <div className="py-6">
        <ReportHeader processedTitle={title} t={t} />
        <main className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[1fr_364px] md:gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex gap-5 lg:gap-6">
              <AvatarWithLock animate={false} />
              <UserInfo
                phoneNumber={phoneNumberFormatted.number}
                carrierResponse={carrierResponse}
                lineType={formattedLineType}
                t={t}
              />
            </div>
            <CallerInfo t={t} />
            <TrustSection t={t} />
          </div>
          <ResultsList t={t} />
        </main>
      </div>
    </section>
  );
};

export default React.memo(SummaryReportCard);

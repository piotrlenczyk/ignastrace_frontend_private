import Image from 'next/image';
import React, { useMemo } from 'react';

import { IconCheckCircle } from '@/components/ui/icon/icons';

import { StartRate } from './startRate';
import type {
  CallerInfoProps,
  ReportHeaderProps,
  ResultsListProps,
  TrustSectionProps,
  UserInfoProps,
} from './types/summary-report.types';

const RESULTS_TO_INCLUDE = 6;

// Subcomponent for user information
export const UserInfo: React.FC<UserInfoProps> = ({ phoneNumber, carrierResponse, lineType, t }) => (
  <ul>
    <li>
      <Image
        src="/images/reverse-lookup/blur_user.png"
        alt="name"
        className="w-[104px] lg:w-[92px]"
        width={248}
        height={68}
      />
    </li>
    <li className="text-lg font-bold">
      {phoneNumber}
    </li>
    <li className="text-sm text-weak">
      {t('carrier')}
      :
      {' '}
      {carrierResponse || 'Unknown'}
    </li>
    <li className="text-sm text-weak">
      {t('line_type')}
      :
      {' '}
      {lineType}
    </li>
  </ul>
);

// Subcomponent for trust section
export const TrustSection: React.FC<TrustSectionProps> = ({ t }) => (
  <div>
    <p
      className="span-green mb-1 text-sm"
      dangerouslySetInnerHTML={{
        __html: t.raw('trusted_by'),
      }}
    />
    <div className="leading-none">
      <StartRate className="size-[14px]" rating={5} />
    </div>
  </div>
);

// Subcomponent for results list
export const ResultsList: React.FC<ResultsListProps> = ({ t }) => {
  const resultsList = useMemo(() => {
    return Array.from({ length: RESULTS_TO_INCLUDE }).map((_, index) => (
      <li key={index} className="flex items-start gap-2">
        <IconCheckCircle className="size-6 text-brand" />
        <span className="text-lg">{t(`result_${index + 1}` as any)}</span>
      </li>
    ));
  }, [t]);

  return (
    <div>
      <h4 className="text-lg font-bold">
        {t('may_include')}
      </h4>
      <ul className="mt-6 flex flex-col gap-4">
        {resultsList}
      </ul>
    </div>
  );
};

// Subcomponent for report header
export const ReportHeader: React.FC<ReportHeaderProps> = ({ processedTitle, t }) => (
  <>
    <h3 className="span-green leading-[1.2] font-bold text-strong lg:mb-1">
      {processedTitle}
    </h3>
    <p className="">{t('latest_report')}</p>
  </>
);

// Subcomponent for caller information
export const CallerInfo: React.FC<CallerInfoProps> = ({ t }) => (
  <p className="caller-info-card text-sm/[20px] text-weak">
    {t('caller_info')}
  </p>
);

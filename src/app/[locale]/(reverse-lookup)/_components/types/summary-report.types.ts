export type SummaryReportProps = {
  phoneNumber: string;
};

export type UserInfoProps = {
  phoneNumber: string;
  carrierResponse?: string;
  lineType: string;
  t: any;
};

export type ReportHeaderProps = {
  processedTitle: React.ReactNode;
  t: any;
};

export type TrustSectionProps = {
  t: any;
};

export type ResultsListProps = {
  t: any;
};

export type CallerInfoProps = {
  t: any;
};

export type SummaryReportData = {
  phoneNumberFormatted: {
    number: string;
    country?: string;
  };
  carrierResponse?: string;
  lineType: string;
  formattedLineType: string;
};

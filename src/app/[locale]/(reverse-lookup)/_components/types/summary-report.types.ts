export type SummaryReportProps = {
  phoneNumber: string;
};

export type UserInfoProps = {
  phoneNumber: string;
  carrier?: string | null;
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
  carrier?: string | null;
  lineType: string;
  formattedLineType: string;
};

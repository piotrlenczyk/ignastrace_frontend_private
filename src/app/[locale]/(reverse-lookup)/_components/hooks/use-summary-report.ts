import { useMemo } from 'react';

import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { detectLineType } from '@/utils/phone-line-detector';

import { useCarrierQuery } from '../../../search/hooks/api/use-carrier-query';

export const useSummaryReport = (phoneNumber: string) => {
  const phoneNumberFormatted = formatPhoneNumber(phoneNumber);
  const { data: carrierResponse } = useCarrierQuery({ phone: phoneNumber });

  // Detect line type
  const lineType = useMemo(() => {
    return detectLineType(phoneNumber, phoneNumberFormatted.country || undefined);
  }, [phoneNumber, phoneNumberFormatted.country]);

  // Format line type for display
  const formattedLineType = useMemo(() => {
    switch (lineType) {
      case 'mobile':
        return 'Mobile';
      case 'landline':
        return 'Landline';
      default:
        return 'Unknown';
    }
  }, [lineType]);

  return {
    phoneNumberFormatted,
    carrierResponse,
    lineType,
    formattedLineType,
  };
};

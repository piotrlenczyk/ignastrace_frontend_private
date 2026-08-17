import { useMemo } from 'react';

import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { useCarrierLookupQuery } from '@/network/api/hooks/use-carrier-lookup-query';
import { detectLineType } from '@/utils/phone-line-detector';

export const useSummaryReport = (phoneNumber: string) => {
  const phoneNumberFormatted = formatPhoneNumber(phoneNumber);
  const { data: carrierLookup } = useCarrierLookupQuery(phoneNumber);

  /*
   * Detect line type locally, on purpose, even though the carrier lookup returns
   * one: the API's enum is mobile / landline / unknown, and the local heuristic
   * also recognises voice over IP. Switching to the API's field would silently
   * lose that case, so this is not an oversight to tidy up.
   */
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
    carrier: carrierLookup?.carrier,
    lineType,
    formattedLineType,
  };
};

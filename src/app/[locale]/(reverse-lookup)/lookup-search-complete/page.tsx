import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { formatPhoneNumber } from '@/hooks/format-phone-number';

import { SearchCompleteContent } from './_components/search-complete-content';

const Index = async () => {
  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  return (
    <FunnelLayout isReverseLookup>
      <SearchCompleteContent phoneNumber={formattedNumber.number} />
    </FunnelLayout>
  );
};

export default Index;

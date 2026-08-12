import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';

import { SearchCompleteContent } from './_components/search-complete-content';

const Index = async () => {
  const phoneNumber = await getFunnelPhone();
  const formattedNumber = usePhoneNumberFormatter(phoneNumber);

  return (
    <FunnelLayout isReverseLookup>
      <SearchCompleteContent phoneNumber={formattedNumber.number} />
    </FunnelLayout>
  );
};

export default Index;

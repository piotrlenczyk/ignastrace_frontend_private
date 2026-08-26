import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { redirectIfAuthenticated } from '@/libs/subscription';

import { SignUpForm } from './_components/sign-up-form';

const Index = async () => {
  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  await redirectIfAuthenticated({
    activeSubscription: ROUTES.REVERSE_LOOKUP.HOME,
    endedSubscription: ROUTES.REVERSE_LOOKUP.HOME,
    noSubscription: formattedNumber.valid ? undefined : ROUTES.REVERSE_LOOKUP.HOME,
  });

  return (
    <FunnelLayout isReverseLookup>
      <SignUpForm phoneNumber={formattedNumber.number} />
    </FunnelLayout>
  );
};

export default Index;

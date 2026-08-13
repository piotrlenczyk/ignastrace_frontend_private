import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';

import { SignUpForm } from './_components/sign-up-form';

const Index = async () => {
  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.REVERSE_LOOKUP.HOME,
    endedSubscriptionRoute: ROUTES.REVERSE_LOOKUP.HOME,
    noSubscriptionRoute: formattedNumber.valid ? undefined : ROUTES.REVERSE_LOOKUP.HOME,
  });

  return (
    <FunnelLayout isReverseLookup>
      <SignUpForm phoneNumber={formattedNumber.number} />
    </FunnelLayout>
  );
};

export default Index;

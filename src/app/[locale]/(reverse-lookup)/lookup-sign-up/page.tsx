import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { useAuthenticatedRedirect } from '@/hooks/use-auth-redirect';
import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';

import { SignUpForm } from './_components/sign-up-form';

const Index = async () => {
  const phoneNumber = await getFunnelPhone();
  const formattedNumber = usePhoneNumberFormatter(phoneNumber);

  await useAuthenticatedRedirect({
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

import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getSession } from '@/server/session/session.server';

import { SearchCompleteContent } from './components/content';

const SearchComplete = async () => {
  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      activeSubscription: phoneNumber
        ? ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING
        : ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
    allowUnauthenticated: true,
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  if (!phoneNumber || !formattedNumber.valid) {
    redirect(ROUTES.HOME);
  }

  const session = await getSession();
  const isAuthenticated = !!session;

  const nextStepURL = isAuthenticated ? ROUTES.CHECKOUT : ROUTES.SIGN_UP;

  return (
    <FunnelLayout>
      <SearchCompleteContent phoneNumber={formattedNumber.number} nextStepURL={nextStepURL} />
    </FunnelLayout>
  );
};

export default SearchComplete;

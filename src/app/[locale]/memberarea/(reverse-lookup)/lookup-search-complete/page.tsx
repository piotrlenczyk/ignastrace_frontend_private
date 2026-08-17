import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getFeatures } from '@/libs/server/feature-flags';
import { getUser } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';

import { SearchCompleteContent } from './_components/search-complete-content';

export default async function LookupSearchCompletePage() {
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const features = await getFeatures();
  const { ENABLE_REVERSE_LOOKUP: enableReverseLookup } = features;

  if (!enableReverseLookup) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  const phoneNumber = await getFunnelPhone();

  if (!phoneNumber) {
    redirect(ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.FORM);
  }

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const formattedNumber = formatPhoneNumber(phoneNumber);

  const user = await getUser();

  return (
    <ProductLayout>
      <SearchCompleteContent phoneNumber={formattedNumber.number} user={user} />
    </ProductLayout>
  );
}

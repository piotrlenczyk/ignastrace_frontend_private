import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { auth } from '@/auth';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';
import { getApi } from '@/libs/server/api';
import { getFeatures } from '@/libs/server/feature-flags';
import type { User } from '@/types/user';

import { SearchCompleteContent } from './_components/search-complete-content';

export default async function LookupSearchCompletePage() {
  const session = await auth();
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

  const formattedNumber = usePhoneNumberFormatter(phoneNumber);

  const api = await getApi();
  const user = await api.get<User>('/user?expand=purchase_info');

  return (
    <ProductLayout>
      <SearchCompleteContent phoneNumber={formattedNumber.number} user={user} />
    </ProductLayout>
  );
}

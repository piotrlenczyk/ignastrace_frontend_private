import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { auth } from '@/auth';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import type { Location } from '@/types/location';

import { DetailStatusClientPage } from './_page';

const DetailStatusPage = async (props: PageProps<'/[locale]/memberarea/status/detail'>) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const isAuthenticated = !!session;

  if (!searchParams?.id) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const phoneNumber = await getFunnelPhone();

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const api = await getApi();
  const location = await api.get<Location>(`/locations/${searchParams?.id}`);

  return (
    <DetailStatusClientPage location={location} />
  );
};

export default DetailStatusPage;

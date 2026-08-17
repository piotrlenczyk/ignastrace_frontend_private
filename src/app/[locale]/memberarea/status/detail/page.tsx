import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { apiServerClient } from '@/network/api/apiServerClient';
import { getServerSession } from '@/server/session/session.utils';

import { DetailStatusClientPage } from './_page';

const DetailStatusPage = async (props: PageProps<'/[locale]/memberarea/status/detail'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  // A query string may repeat a key, and the request's id is one value — the first one.
  const [id] = [searchParams?.id].flat();

  if (!id) {
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

  /*
   * The one Location request this screen is about, read server-side: the captured
   * position and the resolved address travel with it, so the screen has everything
   * it renders by the time it is handed over and geocodes nothing in the browser.
   */
  const { data } = await apiServerClient['/api/v1/location-requests/{id}'].GET({ params: { path: { id } } });

  if (!data) {
    return null;
  }

  return <DetailStatusClientPage locationRequest={data} />;
};

export default DetailStatusPage;

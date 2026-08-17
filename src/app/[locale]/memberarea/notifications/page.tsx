import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getServerSession } from '@/server/session/session.utils';

import NotificationsClientPage from './_page';

export default async function NotificationsPage() {
  const session = await getServerSession();
  const isAuthenticated = !!session;

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

  const unreadCount = 0;
  // TODO: [refactor] get unread count from new API
  // const api = await getApi();
  // const user = await api.get<User>('/user');

  return <NotificationsClientPage unreadNotifications={unreadCount > 0} />;
}

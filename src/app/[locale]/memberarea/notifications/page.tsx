import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getSession } from '@/server/session/session';
import type { User } from '@/types/user';

import NotificationsClientPage from './_page';

export default async function NotificationsPage() {
  const session = await getSession();
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

  const api = await getApi();
  const user = await api.get<User>('/user');

  return <NotificationsClientPage unreadNotifications={user.unread_count > 0} />;
}

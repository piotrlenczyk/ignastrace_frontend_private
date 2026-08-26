import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';

import NotificationsClientPage from './_page';

/**
 * The screen's server entry, and nothing but its guards.
 *
 * It used to read the composed member as well, for the one question "are there
 * unread notifications" — which came from the mocked membership and is now
 * answered by the notification centre itself, in the browser. Everything the
 * screen shows is read there, because the read-marking write needs the ids of the
 * first page where the write is made.
 */
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

  return <NotificationsClientPage />;
}

import { redirect } from 'next/navigation';

// import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
// import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getServerSession } from '@/server/session/session.utils';

import { SettingsLayoutClient } from './layout.client';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const isAuthenticated = session?.isLoggedIn;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  // const phoneNumber = await getFunnelPhone();

  // const redirectUrl = await getSubscriptionRedirect({
  //   routes: {
  //     noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
  //   },
  // });

  // if (redirectUrl) {
  //   redirect(redirectUrl);
  // }

  return (
    <ProductLayout>
      <main className="s-main">
        <SettingsLayoutClient>{children}</SettingsLayoutClient>
      </main>
    </ProductLayout>
  );
}

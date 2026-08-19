import { redirect } from 'next/navigation';

import ThankYouPage from '@/app/[locale]/thank-you/page';
import GTMPurchaseEvent from '@/components/gtm-purchase-event';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getUser } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import UpsellPageClient from './_components/upsell-page-client';
import type { Product } from './_types/product.type';

const UpsellPage = async () => {
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const { upsellsEnabled } = await getServerSettings();

  if (!upsellsEnabled) {
    return <ThankYouPage />;
  }

  const redirectURL = await getSubscriptionRedirect({
    routes: {
      hasUpsellings: ROUTES.MEMBER.STATUS.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
      noSubscription: ROUTES.CHECKOUT,
    },
  });

  if (redirectURL) {
    redirect(redirectURL);
  }

  const api = await getApi();
  const [products, user] = await Promise.all([api.get<Product[]>('/upsellings'), getUser()]);

  if (user.upsellings.length > 0) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  return (
    <>
      <GTMPurchaseEvent
        event="purchase"
        userId={user.id}
        email={user.email}
        value={(user.purchase_info?.trial_price || 0) / 100}
        currency={user.currency.toUpperCase()}
      />
      <FunnelLayout positionMobileHeader="static" showLogoLink={false}>
        <UpsellPageClient products={products} />
      </FunnelLayout>
    </>
  );
};

export default UpsellPage;

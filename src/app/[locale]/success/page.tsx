import { redirect } from 'next/navigation';

import ThankYouPage from '@/app/[locale]/thank-you/page';
import GTMPurchaseEvent from '@/components/gtm-purchase-event';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getUser } from '@/libs/subscription';
import { ownsAnyUpsell, resolveUpsellProduct } from '@/libs/upsell-products';
import { getPurchasedUpsellProducts, getUpsellProducts } from '@/server/getters/upsell-products.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import UpsellPageClient from './_components/upsell-page-client';
import { SUCCESS_UPSELL_KEYS, type UpsellOffer } from './_types/upsell-offer';

/**
 * The order-success screen: the two extras offered to a member who has just paid.
 *
 * Both upstream reads are made here, server-side and in parallel, so the decision
 * to sell or to send the member on is taken before anything renders — no card
 * shows a loading state, and the ownership answer is not something the browser
 * discovers after the offer is on screen. ADR 0032 records the move off the
 * legacy upselling endpoint, which read the offer and wrote the purchase.
 */
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
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
      noSubscription: ROUTES.CHECKOUT,
    },
  });

  if (redirectURL) {
    redirect(redirectURL);
  }

  const [catalogue, purchased, user] = await Promise.all([
    getUpsellProducts(),
    getPurchasedUpsellProducts(),
    getUser(),
  ]);

  /*
   * The ownership read refused, so nothing is known about what this member owns.
   * Fail closed, and the closed answer on this screen is the thank-you screen
   * rather than an error page: seconds after a card was charged, a failure that
   * has nothing to do with that payment is the wrong thing to show.
   */
  if (!purchased) {
    return <ThankYouPage />;
  }

  /*
   * Already bought one of the two, so there is nothing to sell. This is what the
   * screen did with the composed member's list of extras — an invented answer for
   * both of these keys — and it now asks the one upstream that knows.
   */
  if (ownsAnyUpsell(purchased, SUCCESS_UPSELL_KEYS)) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  /*
   * One catalogue read, both keys resolved from it, through the resolver every
   * other upsell screen goes through. A key that resolves to no priced row is
   * simply not offered — nothing is priced from a fallback.
   */
  const offers = SUCCESS_UPSELL_KEYS.reduce<UpsellOffer[]>((resolved, key) => {
    const product = resolveUpsellProduct(catalogue ?? [], key);

    return product ? [...resolved, { key, product }] : resolved;
  }, []);

  /* A catalogue that refused, or one that prices neither extra: no offer to make. */
  if (offers.length === 0) {
    return <ThankYouPage />;
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
        <UpsellPageClient offers={offers} />
      </FunnelLayout>
    </>
  );
};

export default UpsellPage;

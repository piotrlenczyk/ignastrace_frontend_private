import { getCurrencyByCountryCode } from '@/libs/currency';
import {
  getInitialCurrency,
  transformProductsFromPaymentsApi,
  transformUserProductsFromPaymentsApi,
} from '@/libs/pricing';
import { CALLER_COUNTRY_HEADER, paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';

export const getPricePagePricing = async () => {
  const { data = [] } = await paymentsApiServerClient['/products'].GET();
  return transformProductsFromPaymentsApi(data);
};

/**
 * The catalogue as it is offered to anyone, for the market stated.
 *
 * The two checkouts read this one: a visitor arriving from the pricing page has
 * been quoted the guest catalogue and must be charged out of the same one. The
 * market is stated rather than inherited from the edge, so the development
 * country override decides the market the service answers for and the currency
 * this application picks together.
 *
 * Nothing is caught. An unreachable service throws here; a refusal arrives as no
 * catalogue and throws at the point the product cannot be resolved. Either way a
 * screen that cannot state a price does not render one, which is the point:
 * checkout is where money changes hands, and an error page beats a payment form
 * with no price on it.
 *
 * TODO: the screens reading this still decide whether to redirect a member from
 * the mocked membership. The payments integration this follows sends a member
 * holding a subscription in any state to billing instead, and reads the absence
 * of one as its current-subscription endpoint answering not-found. Completing
 * that is what retires the mock on these screens.
 */
export const getPricing = async (country: string) => {
  const { data = [] } = await paymentsApiServerClient['/products'].GET({
    headers: { [CALLER_COUNTRY_HEADER]: country },
  });

  return transformProductsFromPaymentsApi(data);
};

/**
 * Everything a checkout screen needs before it renders: the catalogue, and the
 * currency to open in.
 *
 * The currency is settled here, on the server, so the first render is already
 * consistent — the market's own where the catalogue publishes a price in it, US
 * dollars where it does not. Both checkouts ask the same question, so they ask it
 * in one place.
 */
export const getCheckoutPricing = async (country: string) => {
  const pricing = await getPricing(country);

  return {
    pricing,
    initialCurrency: getInitialCurrency({
      supportedCurrencies: pricing.supportedCurrencies,
      marketCurrency: getCurrencyByCountryCode(country),
    }),
  };
};

/**
 * The catalogue as it is offered to the member making the request.
 *
 * The reactivation dialog reads this one, because someone who has subscribed
 * before is not offered a trial they are no longer eligible for. The payments
 * service answers a signed-in member with the single price that applies to them;
 * when it offers nothing member-specific the guest catalogue stands in, so a
 * member without a personalised price still sees a price. A refusal is
 * indistinguishable from that here and falls back the same way — tolerable only
 * because reactivation is charged the full four-week amount whichever catalogue
 * the price came from, never a trial the member is ineligible for.
 *
 * No cookie is assembled here: the payments server-side client already attaches
 * the session's token as the cookie that service authenticates with.
 */
export const getUserPricing = async (country: string) => {
  const { data } = await paymentsApiServerClient['/products/user'].GET({
    headers: { [CALLER_COUNTRY_HEADER]: country },
  });

  if (data?.length) {
    return transformUserProductsFromPaymentsApi(data);
  }

  return getPricing(country);
};

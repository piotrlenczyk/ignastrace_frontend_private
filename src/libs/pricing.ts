import { DEFAULT_CURRENCY } from '@/constants/currencies';
import type { paymentsSchemas } from '@/network/payments-api/payments-api-server-client';
import {
  type Price,
  type Pricing,
  type ProductWithPrice,
  type ProductWithPrices,
  type ProviderAccount,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from '@/types/pricing.types';

import type { FunnelPlan } from './checkout-cookie';

/**
 * Normalizes a raw provider account into the frontend shape, collapsing the
 * provider-specific public key from the opaque `configuration` into a single
 * `clientKey` used to initialize the provider SDK.
 */
export const mapProviderAccount = (account: paymentsSchemas['ProviderAccountResponseDto']): ProviderAccount => {
  const { configuration, ...rest } = account;
  const config = configuration as {
    publicKey?: string; // stripe
    publicClientKey?: string; // adyen
    publicTokenizationKey?: string; // nmi
  };
  return {
    ...rest,
    clientKey: config.publicKey ?? config.publicClientKey ?? config.publicTokenizationKey,
  };
};

export const getCurrencyProducts = ({ products, currency }: { products: Pricing['products']; currency: string }) => {
  const upperCaseCurrency = currency.toUpperCase();

  const defaultCurrency = 'USD';

  return products.map(({ prices, ...product }) => ({
    ...product,
    price: prices[upperCaseCurrency]! || prices[defaultCurrency]!,
  }));
};

/**
 * The catalogue product a funnel plan is quoted and charged from.
 *
 * Two different things are called a plan here: the funnel plan the visitor chose
 * — trial or outright subscription — and the product name the catalogue
 * publishes. The payments service derives the amount from a price identifier and
 * accepts nothing that could express "skip the trial", so the plan has to select
 * a *product* rather than one of two amounts on a single row. A catalogue that
 * publishes no non-trial four-week product therefore quotes the trial one to
 * someone subscribing outright, by `getPricingProduct`'s fallback; that is the
 * catalogue's answer, not a decision taken here.
 */
export const getPlanProductName = (plan: FunnelPlan): SubscriptionPlan =>
  plan === 'subscription' ? 'FOUR_WEEKS' : 'FOUR_WEEKS_TRIAL';

export const getPricingProduct = ({
  plan,
  currencyProducts,
}: {
  plan: SubscriptionPlan;
  currencyProducts: ProductWithPrice[];
}): ProductWithPrice => {
  const pricing =
    currencyProducts.find((product) => product.name === plan) ?? getDefaultPricingProduct(currencyProducts);

  /*
   * The currency fold asserts a row it has not looked for — the catalogue is
   * trusted to publish US dollars. Checkout is where money changes hands, so the
   * assertion is checked here too: a product priced in neither the selected
   * currency nor US dollars is a misconfigured catalogue, and saying so beats
   * rendering a payment form with no amount on it. Same rule, same words, as
   * `getCheckoutProduct` states for the screens still reading that one.
   */
  if (!pricing.price) {
    throw new Error(`Cannot find a ${pricing.name} price`);
  }

  return pricing;
};

export const getDefaultPricingProduct = (currencyProducts: ProductWithPrice[]) => {
  const fourWeeks = currencyProducts.find((p) => p.name === 'FOUR_WEEKS');
  const fourWeeksTrial = currencyProducts.find((p) => p.name === 'FOUR_WEEKS_TRIAL');
  const plan = fourWeeksTrial || fourWeeks;

  if (!plan) {
    throw new Error('Cannot find default pricing plan');
  }
  return plan;
};

const isSubscriptionPlan = (name?: string): name is SubscriptionPlan => {
  return SUBSCRIPTION_PLANS.includes(name as SubscriptionPlan);
};
export const parseSubscriptionPlanName = (planName?: string): SubscriptionPlan | undefined => {
  if (isSubscriptionPlan(planName)) {
    return planName;
  }
  return undefined;
};

const mapPriceFromPaymentsApi = (price: paymentsSchemas['GetPriceResponseDto']): Price => ({
  ...price,
  finalAmount: price.trialDays > 0 ? price.trialAmount : price.amount,
  providerAccount: mapProviderAccount(price.providerAccount),
});

export const transformProductFromPaymentsApi = (product: paymentsSchemas['GetProductWithOnePriceResponseDto']) => {
  const name = parseSubscriptionPlanName(product.metadata?.planName);
  if (!name) {
    return null;
  }
  return {
    id: product.id,
    sku: product.sku,
    name,
    price: mapPriceFromPaymentsApi(product.price),
    metadata: product.metadata,
  };
};

/**
 * The resubscription catalogue in the guest catalogue's shape.
 *
 * The payments service answers a signed-in member with one already-resolved
 * price per product rather than a price list. Wrapping that single price in a
 * list lets the member read and the guest read resolve through one mapping into
 * one view type, so the screens sharing a payment form share a source of truth
 * without either learning which read it came from.
 */
export const transformUserProductsFromPaymentsApi = (
  data: paymentsSchemas['GetProductWithOnePriceResponseDto'][],
): Pricing => transformProductsFromPaymentsApi(data.map(({ price, ...product }) => ({ ...product, prices: [price] })));

/**
 * The currency a screen opens in: the one the visitor chose where the catalogue
 * still publishes it, the market's own where it does not, US dollars where it
 * publishes neither.
 *
 * Bounding the choice by the catalogue is what keeps the currency a selector
 * shows and the amount beside it in step — a market currency the catalogue never
 * priced would otherwise label a US dollar amount as something else, and a
 * currency someone chose before the catalogue dropped it would do the same. A
 * choice outranks the market because it is the more recent answer to the same
 * question; the catalogue outranks both, which is the same shape
 * `getMemberCurrency` gives a returning member's own currency.
 */
export const getInitialCurrency = ({
  supportedCurrencies,
  marketCurrency,
  preferredCurrency,
}: {
  supportedCurrencies: string[];
  marketCurrency: string;
  preferredCurrency?: string;
}): string => {
  const chosen = preferredCurrency?.toUpperCase();

  if (chosen && supportedCurrencies.includes(chosen)) {
    return chosen;
  }

  const currency = marketCurrency.toUpperCase();

  return supportedCurrencies.includes(currency) ? currency : DEFAULT_CURRENCY;
};

/**
 * The currency a returning member's reactivation price is quoted in.
 *
 * The resubscription catalogue answers with one already-resolved price per
 * product, so there is little to select — but a member who subscribed before has
 * a currency of their own, and it is kept while the catalogue still sells in it.
 * Falling back to what the service resolved, rather than only to US dollars, is
 * what stops a member whose market has moved being quoted nothing at all.
 */
export const getMemberCurrency = ({
  supportedCurrencies,
  previousCurrency,
}: {
  supportedCurrencies: string[];
  previousCurrency?: string;
}): string => {
  const currency = previousCurrency?.toUpperCase();

  if (currency && supportedCurrencies.includes(currency)) {
    return currency;
  }

  if (supportedCurrencies.includes(DEFAULT_CURRENCY)) {
    return DEFAULT_CURRENCY;
  }

  return supportedCurrencies[0] ?? DEFAULT_CURRENCY;
};

/**
 * The one product checkout quotes, priced in one currency.
 *
 * The catalogue publishes a single four-week plan, so there is nothing to choose
 * between: the plan the funnel stored decides which of the row's two amounts is
 * due, not which product is quoted.
 */
export const getCheckoutProduct = ({ pricing, currency }: { pricing: Pricing; currency: string }): ProductWithPrice => {
  const product = getDefaultPricingProduct(getCurrencyProducts({ products: pricing.products, currency }));

  /*
   * The currency fold above asserts a row it has not looked for — the catalogue
   * is trusted to publish US dollars. Checkout is where money changes hands, so
   * it checks: a product priced in neither the selected currency nor US dollars
   * is a misconfigured catalogue, and saying so beats rendering a payment form
   * with no amount on it.
   */

  if (!product.price) {
    throw new Error(`Cannot find a ${product.name} price in ${currency.toUpperCase()} or ${DEFAULT_CURRENCY}`);
  }

  return product;
};

/**
 * Which of a price row's two amounts is due now.
 *
 * One product carries both: the trial charge for a visitor taking the trial, the
 * full four-week amount for one subscribing outright. The catalogue's
 * upsell-inclusive final trial amount is deliberately unused, so that checkout
 * quotes the same number the pricing page quoted.
 */
export const getAmountDue = ({ plan, price }: { plan: FunnelPlan; price: Price }): number =>
  plan === 'subscription' ? price.amount : price.trialAmount;

export const transformProductsFromPaymentsApi = (
  data: paymentsSchemas['GetProductWithAllPricesResponseDto'][],
): Pricing => {
  const products = data
    .sort((a, b) => a.priority - b.priority)
    .map((item) => ({
      id: item.id,
      sku: item.sku,
      name: parseSubscriptionPlanName(item.metadata?.planName),
      prices: item.prices.reduce(
        (acc, price) => {
          acc[price.currency] = mapPriceFromPaymentsApi(price);
          return acc;
        },
        {} as Record<string, Price>,
      ),
    }));

  // Remove products without a name and assert name type
  const allProducts = products.filter((product): product is ProductWithPrices => product.name !== undefined);

  /*
   * The currencies of a product this application actually quotes, rather than of
   * whichever product the catalogue happened to answer first. With one product on
   * sale the two are the same list; they part company the moment the catalogue
   * carries a product under a plan name this application does not know.
   */
  const supportedCurrencies = Object.keys(allProducts[0]?.prices ?? {});

  // Extract the unified provider account from the first available price
  // Note: Assumes all prices resolve to the same provider account
  const rawProviderAccount = data[0]?.prices[0]?.providerAccount;

  return {
    products: allProducts,
    supportedCurrencies,
    providerAccount: rawProviderAccount ? mapProviderAccount(rawProviderAccount) : undefined,
  };
};

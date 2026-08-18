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

export const getPricingProduct = ({
  plan,
  currencyProducts,
}: {
  plan: SubscriptionPlan;
  currencyProducts: ProductWithPrice[];
}) => {
  const pricing = currencyProducts.find((product) => product.name === plan);
  if (!pricing) {
    return getDefaultPricingProduct(currencyProducts);
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

  const supportedCurrencies = Object.keys(products[0]?.prices ?? {});

  // Extract the unified provider account from the first available price
  // Note: Assumes all prices resolve to the same provider account
  const rawProviderAccount = data[0]?.prices[0]?.providerAccount;

  return {
    products: allProducts,
    supportedCurrencies,
    providerAccount: rawProviderAccount ? mapProviderAccount(rawProviderAccount) : undefined,
  };
};

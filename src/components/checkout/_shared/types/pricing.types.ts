import { type paymentsSchemas } from '@/components/checkout/_shared/types/paymentsClient';

export const SUBSCRIPTION_PLANS = [
  'ANNUAL',
  'FOUR_WEEKS',
  'FOUR_WEEKS_TRIAL',
  'FOUR_WEEKS_LIMITED_TRIAL',
  'QUARTERLY',
  'QUARTERLY_TRIAL',
  'QUARTERLY_LIMITED_TRIAL',
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

/**
 * Unified provider account for the frontend.
 *
 * The API exposes provider-specific public keys inside an opaque
 * `configuration` object (Stripe `publicKey`, Adyen `publicClientKey`, NMI
 * `publicTokenizationKey`). During mapping we normalize whichever key is used
 * to initialize the provider SDK into a single `clientKey`, so consumers don't
 * have to branch on `provider`.
 */
export type ProviderAccount = Omit<paymentsSchemas['ProviderAccountResponseDto'], 'configuration'> & {
  /** Public key used to initialize the provider SDK (normalized from configuration). */
  clientKey?: string;
};

export type Price = Omit<paymentsSchemas['GetPriceResponseDto'], 'providerAccount'> & {
  finalAmount: number;
  providerAccount: ProviderAccount;
};

export type ProductWithPrices = {
  id: string;
  sku: string;
  name: SubscriptionPlan;
  prices: Record<string, Price>;
};

export type ProductWithPrice = {
  id: string;
  sku: string;
  name: SubscriptionPlan;
  price: Price;
  metadata?: Record<string, unknown>;
};

export type Pricing = {
  supportedCurrencies: string[];
  products: ProductWithPrices[];
  providerAccount?: ProviderAccount | null;
};

export type SubscriptionDetails = paymentsSchemas['SubscriptionResponseDto'] & {
  hasAccess: boolean;
  couldCancel: boolean;
  couldReactivate: boolean;
  calculatedStatus: CalculatedSubscriptionStatus;
};

export type SubscriptionStatus = paymentsSchemas['UserSubscriptionStatusEnum'];
export type CalculatedSubscriptionStatus = SubscriptionStatus | 'pending';

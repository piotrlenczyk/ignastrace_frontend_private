import { unwrapApiResponse } from '@/network/http-response-handler';
import {
  CALLER_COUNTRY_HEADER,
  paymentsApiServerClient,
  type paymentsSchemas,
} from '@/network/payments-api/payments-api-server-client';

import { getCurrencyFromCountry } from './currency';
import { getUserCountry } from './server/user-country';

type PaymentsProduct = paymentsSchemas['GetProductWithAllPricesResponseDto'];
type PaymentsPrice = paymentsSchemas['GetPriceResponseDto'];

/**
 * The plan the public pricing page quotes. A constant rather than a parameter:
 * the page sells one plan, and a second caller wanting a different one is what
 * would justify widening the entry point — not the possibility of it.
 */
const TRIAL_PLAN_NAME = 'FOUR_WEEKS_TRIAL';

/**
 * The currency quoted to a visitor whose market the payments service publishes
 * no price row for. Upper case, because that is how the service writes a code.
 */
const FALLBACK_CURRENCY = 'USD';

/**
 * The two prices the pricing page quotes, as they actually are: amounts in the
 * currency's minor units, the currency they are in, and how long the trial the
 * first of them buys lasts.
 *
 * Both amounts come off one price row of one product — see the ADR on reading
 * one trial product for two prices.
 */
export type TrialPricing = {
  /** What the visitor is charged to start the trial, in minor units. */
  trialAmount: number;
  /** What the visitor is billed every four weeks after the trial, in minor units. */
  fullAmount: number;
  /** The currency code as the payments service publishes it, upper case. */
  currency: string;
  /** The length of the trial the trial amount buys, in days. */
  trialDays: number;
};

/**
 * The plan name a product is configured under, or `null` when it states none.
 *
 * The specification generator types every `metadata` bag as `Record<string,
 * never>` — it is declared as a free-form object upstream — so reading a key out
 * of one takes a cast. It is done here, once, behind a `typeof` guard, rather
 * than at each call site, and this module is the only place in the application
 * that reaches into a payments metadata bag.
 */
const planNameOf = (product: PaymentsProduct): string | null => {
  const metadata = product.metadata as Record<string, unknown> | undefined;
  const planName = metadata?.planName;

  return typeof planName === 'string' ? planName : null;
};

/**
 * The four-week trial product: the catalogue's own ordering decides, lowest
 * `priority` first, so which product a market is sold is a catalogue setting
 * rather than a coincidence of payload order.
 */
const selectTrialProduct = (products: PaymentsProduct[]): PaymentsProduct | undefined =>
  products
    .filter((product) => planNameOf(product) === TRIAL_PLAN_NAME)
    .sort((a, b) => a.priority - b.priority)
    .at(0);

/**
 * The price row quoted in a market: the market's currency when the product is
 * sold in it, US dollars when it is not.
 *
 * Rows are per currency *and* per payment provider, so several can share a
 * currency. The last one wins, which is what the reference implementation
 * against this same service does, so both applications quote the same number
 * when they are pointed at the same catalogue.
 */
const selectPrice = (product: PaymentsProduct, currency: string): PaymentsPrice | undefined => {
  const byCurrency = new Map<string, PaymentsPrice>();

  for (const price of product.prices) {
    byCurrency.set(price.currency.toUpperCase(), price);
  }

  return byCurrency.get(currency) ?? byCurrency.get(FALLBACK_CURRENCY);
};

/**
 * The pricing the public pricing page quotes, read from the payments catalogue
 * and from nothing else.
 *
 * The market is the one this application resolved for the request — the
 * development country cookie included — and it is stated as the caller country
 * header rather than left to the client's request scope, so the market the
 * service prices for and the market whose currency is picked here are the same
 * one. The client is caller-wins, so stating it is enough.
 *
 * Nothing is cached: the response varies by a header the framework's cache does
 * not key on, and a price change is meant to show on the next page load.
 *
 * A catalogue that carries no four-week trial product, or one that is sold
 * neither in the market's currency nor in US dollars, throws. So does a refusal
 * from the payments service, inside the shared unwrapping. There is no
 * price-less render.
 */
export const getTrialPricing = async (): Promise<TrialPricing> => {
  const country = await getUserCountry();
  const currency = getCurrencyFromCountry(country).toUpperCase();

  const products = await paymentsApiServerClient['/products']
    .GET({ headers: { [CALLER_COUNTRY_HEADER]: country } })
    .then(unwrapApiResponse);

  const product = selectTrialProduct(products);

  if (!product) {
    throw new Error(`The payments catalogue carries no product for the plan ${TRIAL_PLAN_NAME}.`);
  }

  const price = selectPrice(product, currency);

  if (!price) {
    throw new Error(
      `The payments catalogue prices the plan ${TRIAL_PLAN_NAME} in neither ${currency} nor ${FALLBACK_CURRENCY}.`,
    );
  }

  return {
    trialAmount: price.trialAmount,
    fullAmount: price.amount,
    currency: price.currency.toUpperCase(),
    trialDays: price.trialDays,
  };
};

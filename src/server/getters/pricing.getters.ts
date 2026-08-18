import { transformProductsFromPaymentsApi } from '@/libs/pricing';
import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';

export const getPricePagePricing = async () => {
  const { data = [] } = await paymentsApiServerClient['/products'].GET();
  return transformProductsFromPaymentsApi(data);
};

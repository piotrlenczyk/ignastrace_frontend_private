import type { UpsellProductKey } from '@/libs/upsell-products';

export type Product = {
  price: number;
  key: UpsellProductKey;
  currency: string;
};

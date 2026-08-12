import type { Product } from '../_types/product.type';

export function isProductAdded(
  products: Product[],
  productId: string,
): boolean {
  return products.some(product => product.key === productId);
}

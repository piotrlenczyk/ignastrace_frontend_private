import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { IconChevronRightSmall, IconTrashLine } from '@/components/ui/icon/icons';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { useCldrFormatPrice } from '@/hooks/use-cldr-format-price';
import { useCountry } from '@/hooks/useCountry';
import { cn } from '@/libs/utils';

import type { Product } from '../_types/product.type';
import { isProductAdded } from '../_utils/isProductAdded';

export const OrderDetails = ({
  products,
  addedProducts,
  onAddProduct,
  onRemoveProduct,
  className,
}: {
  products: Product[];
  addedProducts: Product[];
  onAddProduct: (product: Product) => void;
  onRemoveProduct: (productId: string) => void;
  className?: string;
}) => {
  const t = useTranslations('pages.upsell');
  const formatPrice = useCldrFormatPrice();

  const total = addedProducts.reduce((acc, product) => acc + product.price, 0);
  const currency = products[0]?.currency || DEFAULT_CURRENCY;
  const locale = useLocale();
  const country = useCountry();

  return (
    <div className={cn('container-content', className)}>
      <h2 className="h4 mb-3 font-bold">{t('order_details')}</h2>
      <table className="order-table mb-6 w-full text-strong">
        <tbody>
          {
            products?.map(product => (
              <tr key={product.key}>
                <td>
                  <Collapsible>
                    <CollapsibleTrigger
                      className={cn(
                        '-my-3 flex py-3 text-left data-[state=open]:[--rotate:90deg]',
                        !isProductAdded(addedProducts, product.key) && 'cursor-default pl-7',
                      )}
                    >
                      {isProductAdded(addedProducts, product.key)
                      && (
                        <IconChevronRightSmall
                          className=" mr-1 mt-[-3px] shrink-0 rotate-[var(--rotate,0deg)]
                                      text-2xl text-neutral  transition-transform duration-200"
                        />
                      )}
                      <span className="flex-1 pr-2">{t(`products.${product.key}.title` as any)}</span>
                    </CollapsibleTrigger>
                    {isProductAdded(addedProducts, product.key)
                    && (
                      <CollapsibleContent
                        className="overflow-hidden pl-3 data-[state=closed]:animate-accordion-up
                                   data-[state=open]:animate-accordion-down"
                      >
                        <Button
                          variant="ghost"
                          className="font-normal hover:underline"
                          onClick={() => onRemoveProduct(product.key)}
                        >
                          <IconTrashLine className="text-xl text-neutral" />
                          {t(`products.remove_button`)}
                        </Button>

                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </td>
                <td>
                  {isProductAdded(addedProducts, product.key)
                    ? (
                        <>
                          {formatPrice(product.price, currency, country, locale)}
                        </>
                      )
                    : (
                        <Button
                          variant="tertiary"
                          onClick={() => onAddProduct(product)}
                          className="whitespace-nowrap p-0"
                        >
                          {t('products.add_order_button', {
                            price: formatPrice(product.price, currency, country, locale),
                          })}
                        </Button>
                      )}

                </td>
              </tr>
            ))
          }
        </tbody>
        <tfoot>
          <tr>
            <td className="text-base font-bold">{t('total')}</td>
            <td>{formatPrice(total, currency, country, locale)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="mb-6 flex justify-center gap-2">
        <Image src="/images/payment-visa.svg" width="47" height="32" alt="VISA" />
        <Image src="/images/payment-mastercard.svg" width="47" height="32" alt="Mastercard" />
        <Image src="/images/payment-amex.svg" width="47" height="32" alt="AMEX" />
      </div>
    </div>
  );
};

/* eslint-disable react-dom/no-dangerously-set-innerhtml */
import { DialogDescription, DialogPortal, DialogTitle } from '@radix-ui/react-dialog';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { IconCheck, IconRadarAlt, IconSupportLine } from '@/components/ui/icon/icons';
import { useCldrFormatPrice } from '@/hooks/use-cldr-format-price';
import { useCountry } from '@/hooks/useCountry';

import type { Product } from '../_types/product.type';
import { isProductAdded } from '../_utils/isProductAdded';

export const ProductCards = ({
  products,
  addedProducts,
  onAddProduct,
}: {
  products: Product[];
  addedProducts: Product[];
  onAddProduct: (product: Product) => void;
}) => {
  const [dialogProduct, setDialogProduct] = useState<Product>();
  const t = useTranslations('pages.upsell');
  const formatPrice = useCldrFormatPrice();
  const locale = useLocale();
  const country = useCountry();

  const toggleDialog = (product: Product) => {
    if (product === dialogProduct) {
      setDialogProduct(undefined);
    }
  };

  const openDialog = (product: Product) => {
    setDialogProduct(product);
  };

  return (

    <div className="container-content">
      <div className="mx-auto my-0 flex w-full max-w-full overflow-x-auto pb-6">
        {
          products && products.map(product => (
            <div
              className={`
                box-content flex max-w-[50%] min-w-[280px] flex-1 px-3 first:pl-5 last:pr-5 md:first:pl-0 md:last:pr-0
              `}
              key={product.key}
            >
              <div
                className="flex flex-1 flex-col gap-4 rounded-2xl bg-base p-6 text-strong shadow-raised"
              >
                <div className="brand-icon">
                  {product.key === 'scan_pro' && <IconRadarAlt size="large" />}
                  {product.key === 'support_hotline' && <IconSupportLine size="large" />}
                </div>
                <div>
                  <h2 className="mb-1 text-lg/normal font-bold">{t(`products.${product.key}.title` as any)}</h2>
                  <p className="text-sm">
                    {t(`products.${product.key}.description` as any)}
                  </p>
                </div>
                <div className="mt-auto font-semibold">
                  {formatPrice(product.price, product.currency, country, locale)}
                </div>
                <div className="flex min-h-10 items-center justify-between gap-4">
                  {isProductAdded(addedProducts, product.key)
                    ? (
                        <div className={`
                          flex items-center gap-1 rounded-lg border border-green-800 bg-white px-3 py-2 text-sm
                          font-bold text-green
                        `}
                        >
                          <IconCheck className="text-base" />
                          {t('products.added_state')}
                        </div>
                      )
                    : <Button onClick={() => onAddProduct(product)}>{t('products.add_button')}</Button>}

                  <Dialog open={dialogProduct === product} onOpenChange={() => toggleDialog(product)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="tertiary" onClick={() => openDialog(product)}>
                        {t('products.details_button')}
                      </Button>
                    </DialogTrigger>
                    <DialogPortal>
                      <DialogContent className="dialog-products">
                        <DialogHeader className="mb-6">
                          <div className="brand-icon mb-4">
                            {product.key === 'scan_pro' && <IconRadarAlt size="large" />}
                            {product.key === 'support_hotline' && <IconSupportLine size="large" />}
                          </div>
                          <DialogTitle className="h3 font-bold">
                            {t(`products.${product.key}.title` as any)}
                          </DialogTitle>
                        </DialogHeader>

                        {product.key === 'scan_pro' && (
                          <DialogDescription asChild>
                            <div
                              dangerouslySetInnerHTML={{ __html: t.raw(`products.${product.key}.dialog`) }}
                            />
                          </DialogDescription>
                        )}

                        {product.key === 'support_hotline' && (
                          <DialogDescription asChild>
                            <div
                              dangerouslySetInnerHTML={{ __html: t.raw(`products.${product.key}.description`) }}
                            />
                          </DialogDescription>
                        )}

                        <DialogFooter className="mt-4 min-h-10 items-center justify-between">
                          {isProductAdded(addedProducts, product.key)
                            ? (
                                <div className={`
                                  flex items-center gap-1 rounded-lg border border-green-800 bg-white px-3 py-2 text-sm
                                  font-bold text-green
                                `}
                                >
                                  <IconCheck className="text-xl" />
                                  {t('products.added_state')}
                                </div>
                              )
                            : <Button onClick={() => onAddProduct(product)}>{t('products.add_button')}</Button>}

                          <div className="font-semibold">
                            {formatPrice(product.price, product.currency, country, locale)}
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </DialogPortal>
                  </Dialog>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

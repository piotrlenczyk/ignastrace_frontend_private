import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import CheckoutForm from '@/components/forms/checkout-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetProduct } from '@/hooks/api/use-get-product';
import { getCurrencyFromCountry } from '@/libs/currency';
import type { Products } from '@/types/products';

export function ActivateSubscription({
  buttonText,
  country,
}: {
  buttonText: string;
  country: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.settings.billing.activate_dialog');
  const [product, setProduct] = useState<Products>();
  const currency = getCurrencyFromCountry(country);

  const { mutate: getProduct } = useGetProduct({
    onSuccess: (data) => {
      setProduct(data);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  useEffect(() => {
    getProduct(currency);
  }, [currency, getProduct]);

  return (
    <>
      <Button className="mt-4" onClick={() => setIsOpen(true)}>{buttonText}</Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="h4 font-bold">{t('title')}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-2">
            {product && (
              <CheckoutForm
                currency={currency}
                defaultProduct={product}
                country={country}
                buttonText={t('action_form')}
                isReactivate
              />
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

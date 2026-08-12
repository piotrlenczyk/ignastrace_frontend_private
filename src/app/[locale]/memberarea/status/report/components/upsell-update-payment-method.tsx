'use client';

import { useTranslations } from 'next-intl';

import type { Product } from '@/app/[locale]/success/_types/product.type';
import UpsellCheckoutForm from '@/components/forms/upsell-checkout-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type UpsellUpdatePaymentMethodProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentMethodUpdated: (closeDialogFn: () => void) => void;
  product: Product;
  country: string;
};

export function UpsellUpdatePaymentMethod({
  open,
  onOpenChange,
  onPaymentMethodUpdated,
  country,
  product,
}: UpsellUpdatePaymentMethodProps) {
  const t = useTranslations('pages.reverse_lookup.report.upsell.payment_message');

  const handleSuccess = () => {
    onPaymentMethodUpdated(() => {
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="h4 font-bold">{t('add_payment_details')}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-2">
          <UpsellCheckoutForm
            product={product}
            country={country}
            buttonText={t('update_payment_method')}
            onSuccess={handleSuccess}
          />
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

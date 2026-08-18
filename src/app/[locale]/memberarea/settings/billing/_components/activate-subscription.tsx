import { useTranslations } from 'next-intl';
import { useState } from 'react';

import CheckoutForm from '@/components/forms/checkout-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ProductWithPrice } from '@/types/pricing.types';

export function ActivateSubscription({
  buttonText,
  country,
  product,
}: {
  buttonText: string;
  country: string;
  /** Resolved on the server, so the dialog already knows the price when it opens. */
  product: ProductWithPrice;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.settings.billing.activate_dialog');

  return (
    <>
      <Button className="mt-4" onClick={() => setIsOpen(true)}>
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="h4 font-bold">{t('title')}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-2">
            <CheckoutForm product={product} country={country} buttonText={t('action_form')} isReactivate />
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

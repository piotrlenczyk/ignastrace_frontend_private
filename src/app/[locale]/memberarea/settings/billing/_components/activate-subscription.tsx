'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import {
  getAdyenRedirectSource,
  getRedirectResultFromLocation,
  isResumingAdyenRedirect,
} from '@/components/checkout/adyen/adyenRedirect.helpers';
import { Checkout } from '@/components/checkout/Checkout';
import { PaymentTrustRow } from '@/components/payment-trust-row';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from '@/libs/i18n-routing';
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
  const [isResolvingRedirect, setIsResolvingRedirect] = useState(false);
  const t = useTranslations('pages.settings.billing.activate_dialog');
  const router = useRouter();

  /*
   * A member sent away for a redirect-based 3-D Secure challenge comes back to
   * this screen with nothing open on it, and the payment is only completed by the
   * island — so the dialog reopens itself for them. The two signals are read
   * after mounting rather than during the render: they live in session storage and
   * the address bar, neither of which the server render can see, and a state
   * initialiser that disagreed with the server would break hydration on a screen
   * that has a payment to finish.
   */
  useEffect(() => {
    if (
      isResumingAdyenRedirect({
        redirectSource: getAdyenRedirectSource(),
        redirectResult: getRedirectResultFromLocation(),
      })
    ) {
      setIsOpen(true);
    }
  }, []);

  /*
   * The equivalent of the full reload this used to do: the billing screen reads
   * its subscription on the server, so refreshing it is what shows the member the
   * result, and the dialog closes over the refreshed screen.
   */
  const handlePaymentSuccess = () => {
    router.refresh();
    setIsOpen(false);
  };

  /*
   * While a redirect is being resolved the dialog cannot be dismissed. Every
   * other moment of a payment is covered by the island's own overlay, which sits
   * above this dialog; a payment being finished on arrival raises no overlay, and
   * a stray click on the backdrop would unmount the island with the charge in
   * flight.
   */
  const handleOpenChange = (open: boolean) => {
    if (!open && isResolvingRedirect) {
      return;
    }

    setIsOpen(open);
  };

  return (
    <>
      <Button className="mt-4" onClick={() => setIsOpen(true)}>
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg" aria-describedby={undefined} hideCloseButton={isResolvingRedirect}>
          <DialogHeader className="mb-4">
            <DialogTitle className="h4 font-bold">{t('title')}</DialogTitle>
          </DialogHeader>
          {/*
           * The island renders divs and a form, so it cannot live in the dialog's
           * description element — that one is a paragraph, and neither may legally
           * nest inside it.
           */}
          <Checkout
            product={product}
            country={country}
            onSuccess={handlePaymentSuccess}
            onRedirectResolvingChange={setIsResolvingRedirect}
            submitLabel={t('action_form')}
          />
          <PaymentTrustRow />
        </DialogContent>
      </Dialog>
    </>
  );
}

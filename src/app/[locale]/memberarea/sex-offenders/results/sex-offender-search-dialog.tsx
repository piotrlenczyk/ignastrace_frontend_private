'use client';

import { useState } from 'react';

import {
  type UpsellNamespace,
  UpsellOfferDialog,
} from '@/app/[locale]/memberarea/status/report/components/upsell-offer-dialog';
import { UpsellPaymentMessage } from '@/app/[locale]/memberarea/status/report/components/upsell-payment-message';
import { resolveUpsellProduct } from '@/libs/upsell-products';
import { useUpsellProductsQuery } from '@/network/payments-api/hooks/use-upsell-products-query';

import { type PurchaseUpsellResponse, usePurchaseUpsell } from '../hooks/api/use-purchase-upsell-mutation';

type SexOffenderSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translationNamespace: UpsellNamespace;
  benefitKeys: string[];
  sexOffenderSearchId: string;
  candidateIndex: number;
  onPurchaseSuccess: (data?: PurchaseUpsellResponse) => void;
  onSuccessClose: () => void;
};

/**
 * The standalone sex-offender search's purchase, which stays on the legacy
 * catalogue.
 *
 * **The one upselling purchase ADR 0030 did not move**, and for a reason that is
 * about the response rather than about the charge: this call also creates the
 * search report and answers with its identifier, which is what the screen
 * navigates to. `POST /products/upsell/buy` answers with a transaction and
 * nothing else, so moving this purchase would lose the report.
 *
 * So the price is the payments service's and the charge is the legacy
 * catalogue's — the divergence ADR 0029 named, surviving here alone. It closes
 * when the new API publishes a search of its own, which is a task and not a
 * change to this file.
 *
 * The offer and the message are the same components every migrated upsell uses,
 * so a member sees no difference. No Stripe is initialised: the legacy purchase
 * charges the card on file and answers no client secret.
 */
export const SexOffenderSearchDialog = ({
  open,
  onOpenChange,
  translationNamespace,
  benefitKeys,
  sexOffenderSearchId,
  candidateIndex,
  onPurchaseSuccess,
  onSuccessClose,
}: SexOffenderSearchDialogProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  const { data: upsellProducts } = useUpsellProductsQuery();
  const product = resolveUpsellProduct(upsellProducts ?? [], 'sex_offenders_search');

  const { mutate: purchaseUpsell, isPending } = usePurchaseUpsell({
    onSuccess: (data) => {
      onOpenChange(false);
      setShowMessage(true);
      setIsSuccess(true);
      setRetryCount(0);
      onPurchaseSuccess(data);
    },
    onError: () => {
      onOpenChange(false);
      setShowMessage(true);
      setIsSuccess(false);
      setRetryCount((previous) => previous + 1);
    },
  });

  const handlePurchase = () => purchaseUpsell({ sexOffenderSearchId, candidateIndex });

  /* No resolved product, no offer — the same rule ADR 0029 gave every other upsell screen. */
  if (!product) {
    return null;
  }

  return (
    <>
      <UpsellOfferDialog
        open={open}
        onOpenChange={onOpenChange}
        product={product}
        translationNamespace={translationNamespace}
        benefitKeys={benefitKeys}
        onPurchase={handlePurchase}
        isPending={isPending}
      />

      <UpsellPaymentMessage
        open={showMessage}
        onOpenChange={setShowMessage}
        isSuccess={isSuccess}
        retryCount={retryCount}
        onSuccessClose={onSuccessClose}
        onRetry={handlePurchase}
        isRetrying={isPending}
        product="sex_offenders_search"
      />
    </>
  );
};

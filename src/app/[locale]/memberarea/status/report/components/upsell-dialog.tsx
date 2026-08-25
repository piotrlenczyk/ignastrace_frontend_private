'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { UpsellPurchaseSurface } from '@/components/upsell/upsell-purchase-surface';
import { useUpsellUnlock } from '@/hooks/api/use-upsell-unlock';
import {
  creditProductFor,
  resolveUpsellProduct,
  type UpsellProduct,
  type UpsellProductKey,
} from '@/libs/upsell-products';
import { CURRENT_USER_QUERY_KEY } from '@/network/api/hooks/use-current-user-query';
import { useUpsellProductsQuery } from '@/network/payments-api/hooks/use-upsell-products-query';

import { type UpsellNamespace, UpsellOfferDialog } from './upsell-offer-dialog';
import { UpsellPaymentMessage } from './upsell-payment-message';

/*
 * The four upsells this dialog is opened for. The standalone sex-offender search
 * is not among them — its purchase also creates the search report and answers
 * with its identifier, which the payments purchase cannot, so it keeps the legacy
 * call and its own dialog. Nor are the two the `/success` screen sells. A subset
 * of the application's upsell keys rather than a union of its own, so a key that
 * stops existing stops compiling here.
 */
type ProductKey = Extract<
  UpsellProductKey,
  'data_leaks' | 'sex_offenders' | 'social_networks' | 'unlimited_pdf_downloads'
>;

type UpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPdf?: () => Promise<void>;
  onSuccessClose?: () => void;
  productKey: ProductKey;
  translationNamespace: UpsellNamespace;
  benefitKeys: string[];
  /** The report a credit is spent against. Absent for unlimited PDF downloads, which spends none. */
  reportId?: string;
  /** The report owner this unlock applies to. Required by the new API for sex offenders, forbidden elsewhere. */
  ownerId?: string;
};

/**
 * The member area's unlock dialog: one price, one gesture, and the amount it
 * charges is the amount it displays.
 *
 * Both halves of an unlock happen behind the one button. For the three products
 * the new API holds a credit balance for, a credit is spent and one is bought
 * first only where there is nothing to spend; for unlimited PDF downloads there
 * is no balance and the purchase is the whole of it. Which of the two applies is
 * read off `creditProductFor`, not decided here. See ADR 0030.
 */
const UpsellDialog = (props: UpsellDialogProps) => {
  /*
   * The price and the charge both come from the payments service now, off the same
   * row. A query rather than the mutation-in-an-effect this replaced, so four
   * dialogs on one report share one request and a read looks like a read.
   */
  const { data: upsellProducts } = useUpsellProductsQuery();
  const product = resolveUpsellProduct(upsellProducts ?? [], props.productKey);

  /*
   * Nothing below this mounts until the member has opened the dialog at least
   * once. Five of these sit on one report screen, and the purchase surface loads
   * Stripe.js — so mounting them all eagerly would fetch a third-party script on
   * every report view for a purchase nobody has asked for. It latches on rather
   * than tracking `open`, because the payment message outlives the offer it
   * reports on — unmounting when the offer closes would take the report of the
   * charge with it.
   */
  const [hasOpened, setHasOpened] = useState(false);

  if (props.open && !hasOpened) {
    setHasOpened(true);
  }

  /*
   * No resolved product, no offer. The payments catalogue carries no row for this
   * upsell, the row it carries has no price, or the call was refused — and in
   * every one of those cases there is no amount any upstream stands behind, so
   * the member is not offered the purchase at all. ADR 0029 records the trade.
   */
  if (!product || !hasOpened) {
    return null;
  }

  return (
    <UpsellPurchaseSurface price={product.price}>
      <UpsellPurchase {...props} product={product} />
    </UpsellPurchaseSurface>
  );
};

/**
 * Inside the purchase surface, where the 3-D Secure confirmation is reachable.
 *
 * Split out for that reason alone: the Stripe instance the confirmation runs on
 * comes from an Elements root, and a component cannot both provide that context
 * and read it.
 */
const UpsellPurchase = ({
  open,
  onOpenChange,
  onDownloadPdf,
  onSuccessClose,
  productKey,
  translationNamespace,
  benefitKeys,
  reportId,
  ownerId,
  product,
}: UpsellDialogProps & { product: UpsellProduct }) => {
  const { unlockWithCredit, purchase } = useUpsellUnlock();
  const queryClient = useQueryClient();

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  const creditProduct = creditProductFor(productKey);

  const handlePurchase = async () => {
    setIsPending(true);

    /*
     * A credit-balance product is unlocked; anything else is simply bought. The
     * `reportId` guard is the type checker's rather than a case that happens: every
     * caller opening a credit-balance dialog passes the report it is unlocking, and
     * a spend with nothing to spend against is not representable.
     */
    const succeeded =
      creditProduct && reportId
        ? (await unlockWithCredit({ product: creditProduct, reportId, ownerId }, product.price.id)).outcome ===
          'unlocked'
        : (await purchase(product.price.id)).outcome === 'purchased';

    /*
     * Unlimited PDF downloads is an entitlement on the account rather than a
     * balance, so what a screen gates on is the current-user read. Invalidating it
     * here is the client-side half; the refresh the success message fires is the
     * server-rendered half.
     */
    if (succeeded && !creditProduct) {
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    }

    setIsPending(false);
    onOpenChange(false);
    setShowMessage(true);
    setIsSuccess(succeeded);
    setRetryCount(succeeded ? 0 : (previous) => previous + 1);
  };

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
        onDownloadPdf={onDownloadPdf}
        isSuccess={isSuccess}
        retryCount={retryCount}
        onSuccessClose={onSuccessClose}
        onRetry={handlePurchase}
        isRetrying={isPending}
        product={productKey}
      />
    </>
  );
};

export default UpsellDialog;

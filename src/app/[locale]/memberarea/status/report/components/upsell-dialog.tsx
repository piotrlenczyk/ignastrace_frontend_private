'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import LimitedOfferTag from '@/components/reverse-lookup/limited-offer-tag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { resolveUpsellProduct, type UpsellProductKey } from '@/libs/upsell-products';
import { useUpsellProductsQuery } from '@/network/payments-api/hooks/use-upsell-products-query';
import { useSettings } from '@/settings/settings.provider';

import { type PurchaseUpsellResponse, usePurchaseUpsell } from '../_hooks/api/use-purchase-upsell-mutation';
import { UpsellPaymentMessage } from './upsell-payment-message';
import { UpsellUpdatePaymentMethod } from './upsell-update-payment-method';

/*
 * The five upsells this dialog is opened for — the two the `/success` screen
 * sells are not among them. A subset of the application's upsell keys rather
 * than a union of its own, so a key that stops existing stops compiling here.
 */
type ProductKey = Extract<
  UpsellProductKey,
  'data_leaks' | 'sex_offenders' | 'sex_offenders_search' | 'social_networks' | 'unlimited_pdf_downloads'
>;

type PurchaseParams = {
  reverseLookupId?: string;
  ownerId?: string;
  sexOffenderSearchId?: string;
  candidateIndex?: number;
};

/*
 * Every caller passes a namespace under `…report.upsell`. Saying so, rather
 * than accepting any namespace at all, is also what keeps this compiling: with
 * next-intl v4's typed messages, `useTranslations` over the full namespace
 * union instantiates one `t` signature per namespace in en.json and TypeScript
 * gives up ("excessively deep").
 */
type UpsellNamespace = Extract<Parameters<typeof useTranslations>[0], `pages.reverse_lookup.report.upsell.${string}`>;

type UpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPdf?: () => Promise<void>;
  onPurchaseSuccess?: (data?: PurchaseUpsellResponse) => void;
  onSuccessClose?: () => void;
  productKey: ProductKey;
  translationNamespace: UpsellNamespace;
  benefitKeys: string[];
  purchaseParams?: PurchaseParams;
  paymentMessageReportId?: string;
};

const UpsellDialog = ({
  open,
  onOpenChange,
  onDownloadPdf,
  onPurchaseSuccess,
  onSuccessClose,
  productKey,
  translationNamespace,
  benefitKeys,
  purchaseParams,
  paymentMessageReportId,
}: UpsellDialogProps) => {
  const t = useTranslations(translationNamespace);
  const formatPrice = createPriceFormatter();
  const locale = useLocale();
  const { countryCode: country } = useSettings();

  const [isSuccess, setIsSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [showUpdatePaymentMethod, setShowUpdatePaymentMethod] = useState(false);

  /*
   * The price comes from the payments service and the purchase goes to the
   * legacy catalogue — the divergence ADR 0029 accepts. A query rather than the
   * mutation-in-an-effect this replaced, so four dialogs on one report share one
   * request and a read looks like a read.
   */
  const { data: upsellProducts } = useUpsellProductsQuery();
  const product = resolveUpsellProduct(upsellProducts ?? [], productKey);

  const closeDialogRef = useRef<(() => void) | null>(null);

  const { mutate: purchaseUpsell, isPending } = usePurchaseUpsell({
    onSuccess: (data) => {
      closeDialogRef.current?.();
      closeDialogRef.current = null;

      onOpenChange(false);
      setShowMessage(true);
      setIsSuccess(true);
      setRetryCount(0);
      onPurchaseSuccess?.(data);
    },
    onError: () => {
      closeDialogRef.current?.();
      closeDialogRef.current = null;

      onOpenChange(false);
      setShowMessage(true);
      setIsSuccess(false);
      setRetryCount((prev) => prev + 1);
    },
  });

  const handlePurchaseUpsell = () => {
    purchaseUpsell({
      ...purchaseParams,
      product: productKey,
    });
  };

  const handleRetry = () => {
    handlePurchaseUpsell();
  };

  const handleUpdatePaymentMethod = () => {
    setShowMessage(false);
    setShowUpdatePaymentMethod(true);
  };

  const handlePaymentMethodUpdated = (closeDialogFn: () => void) => {
    closeDialogRef.current = closeDialogFn;
    handlePurchaseUpsell();
  };

  const upsellBenefits = benefitKeys.map((key) => ({
    icon: <Icon name="check-circle" className="size-6 text-secondary" />,
    title: t(key as any),
  }));

  /*
   * No resolved product, no offer. The payments catalogue carries no row for this
   * upsell, the row it carries has no price, or the call was refused — and in
   * every one of those cases there is no amount to put on the button, so the
   * member is not offered the purchase at all. This replaces a hardcoded $1.95
   * that was shown whenever the read did not answer. Every hook above runs first;
   * the branch is here rather than earlier for that reason alone.
   */
  if (!product) {
    return null;
  }

  const formattedPrice = formatPrice(product.price.amount, product.price.currency, country, locale);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[500px] p-6 md:p-8" hideCloseButton>
          <DialogTitle className="sr-only"></DialogTitle>
          <div className="flex flex-col gap-5">
            <h4 className="h4 font-bold">{t('title')}</h4>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold">{t('total_due_today')}</h4>
                  <span className="h4 text-right font-bold">{formattedPrice}</span>
                </div>
                <LimitedOfferTag className="mx-auto" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                  <Icon name="discount" className="size-6" />
                  <span className="text-sm lg:text-base">{t('special_limited_time_offer')}</span>
                </div>
                {upsellBenefits.map((benefit) => (
                  <div key={benefit.title} className="flex gap-[6px]">
                    {benefit.icon}
                    <span className="text-sm lg:text-base">{benefit.title}</span>
                  </div>
                ))}
              </div>
              <div className="text-caption whitespace-pre-line text-weak">
                {t('disclaimer_info', { price: formattedPrice })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" onClick={() => onOpenChange(false)} className="text-base font-semibold">
                {t('cancel')}
              </Button>
              <Button className="text-base font-semibold" onClick={handlePurchaseUpsell} disabled={isPending}>
                {isPending ? (
                  <>
                    {t('processing_payment')} <Icon name="reload" className="size-4 animate-spin" />
                  </>
                ) : (
                  t('purchase')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UpsellPaymentMessage
        open={showMessage}
        onOpenChange={setShowMessage}
        onDownloadPdf={onDownloadPdf}
        reportId={paymentMessageReportId}
        isSuccess={isSuccess}
        retryCount={retryCount}
        onSuccessClose={onSuccessClose}
        onRetry={handleRetry}
        onUpdatePaymentMethod={handleUpdatePaymentMethod}
        isRetrying={isPending}
        product={productKey}
      />

      <UpsellUpdatePaymentMethod
        open={showUpdatePaymentMethod}
        onOpenChange={setShowUpdatePaymentMethod}
        product={product}
        country={country}
        onPaymentMethodUpdated={handlePaymentMethodUpdated}
      />
    </>
  );
};

export default UpsellDialog;

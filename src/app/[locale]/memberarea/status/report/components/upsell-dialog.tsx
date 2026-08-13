'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import type { Product } from '@/app/[locale]/success/_types/product.type';
import LimitedOfferTag from '@/components/reverse-lookup/limited-offer-tag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { IconCheckCircle } from '@/components/ui/icon/icons/CheckCircle';
import { IconLoaderCircle } from '@/components/ui/icon/icons/LoaderCircle';
import { IconTagLine } from '@/components/ui/icon/icons/TagLine';
import { useCldrFormatPrice } from '@/hooks/use-cldr-format-price';
import { useCountry } from '@/hooks/useCountry';

import { useGetUpsellProductsMutation } from '../_hooks/api/use-get-upsell-products-mutation';
import { type PurchaseUpsellResponse, usePurchaseUpsell } from '../_hooks/api/use-purchase-upsell-mutation';
import { UpsellPaymentMessage } from './upsell-payment-message';
import { UpsellUpdatePaymentMethod } from './upsell-update-payment-method';

type ProductKey =
  | 'data_leaks'
  | 'sex_offenders'
  | 'sex_offenders_search'
  | 'unlimited_pdf_downloads'
  | 'social_networks';

type PurchaseParams = {
  reverseLookupId?: string;
  ownerId?: string;
  sexOffenderSearchId?: string;
  candidateIndex?: number;
};

type UpsellDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPdf?: () => Promise<void>;
  onPurchaseSuccess?: (data?: PurchaseUpsellResponse) => void;
  onSuccessClose?: () => void;
  productKey: ProductKey;
  translationNamespace: Parameters<typeof useTranslations>[0];
  benefitKeys: string[];
  purchaseParams?: PurchaseParams;
  paymentMessageReportId?: string;
  defaultPrice?: number;
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
  defaultPrice = 195,
}: UpsellDialogProps) => {
  const t = useTranslations(translationNamespace);
  const formatPrice = useCldrFormatPrice();
  const locale = useLocale();
  const country = useCountry();

  const [isSuccess, setIsSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [showUpdatePaymentMethod, setShowUpdatePaymentMethod] = useState(false);
  const [product, setProduct] = useState<Product>({
    key: productKey,
    price: defaultPrice,
    currency: 'USD',
  });

  const formattedPrice = formatPrice(product.price, product.currency, country, locale);

  const { mutate: getUpsellProducts } = useGetUpsellProductsMutation({
    onSuccess: (products) => {
      const upsellProduct = products.find(p => p.key === productKey);
      if (upsellProduct) {
        setProduct(upsellProduct);
      }
    },
    onError: () => {
      console.error('Error getting upsell products');
    },
  });

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
      setRetryCount(prev => prev + 1);
    },
  });

  useEffect(() => {
    getUpsellProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePurchaseUpsell = () => {
    purchaseUpsell({
      ...purchaseParams,
      product: product.key,
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

  const upsellBenefits = benefitKeys.map(key => ({
    icon: <IconCheckCircle className="size-6 text-secondary" />,
    title: t(key as any),
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[500px] p-6 md:p-8" hideCloseButton>
          <DialogTitle className="sr-only"></DialogTitle>
          <div className="flex flex-col gap-5">
            <h4 className="h4 font-bold">
              {t('title')}
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold">{t('total_due_today')}</h4>
                  <span className="h4 text-right font-bold">
                    {formattedPrice}
                  </span>
                </div>
                <LimitedOfferTag className="mx-auto" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                  <IconTagLine className="size-6" />
                  <span className="text-sm lg:text-base">
                    {t('special_limited_time_offer')}
                  </span>
                </div>
                {upsellBenefits.map(benefit => (
                  <div key={benefit.title} className="flex gap-[6px]">
                    {benefit.icon}
                    <span className="text-sm lg:text-base">
                      {benefit.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-caption whitespace-pre-line text-weak">
                {t('disclaimer_info', { price: formattedPrice })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="text-base font-semibold"
              >
                {t('cancel')}
              </Button>
              <Button
                className="text-base font-semibold"
                onClick={handlePurchaseUpsell}
                disabled={isPending}
              >
                {isPending
                  ? (
                      <>
                        {t('processing_payment')}
                        {' '}
                        <IconLoaderCircle className="size-4 animate-spin" />
                      </>
                    )
                  : t('purchase')}
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

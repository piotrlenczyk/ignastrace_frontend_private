import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

type UpsellPaymentMessageProps = {
  onOpenChange: (open: boolean) => void;
  onDownloadPdf?: () => Promise<void>;
  onSuccessClose?: () => void;
  open?: boolean;
  isSuccess?: boolean;
  retryCount: number;
  product: 'data_leaks' | 'sex_offenders' | 'sex_offenders_search' | 'unlimited_pdf_downloads' | 'social_networks';
  onRetry: () => void;
  isRetrying?: boolean;
};

type UpsellPaymentMessageButtonsProps = {
  isSuccess: boolean;
  retryingPayment: boolean;
  onSuccess: () => void;
  onRetry: () => void;
  onClose: () => void;
  isRetrying?: boolean;
};

function UpsellPaymentMessageButtons({
  isSuccess,
  retryingPayment,
  onSuccess,
  onRetry,
  onClose,
  isRetrying = false,
}: UpsellPaymentMessageButtonsProps) {
  const t = useTranslations('pages.reverse_lookup.report.upsell.payment_message');
  const buttonClassName = 'w-full text-lg font-semibold';

  if (isSuccess) {
    return (
      <Button className={buttonClassName} type="button" onClick={onSuccess}>
        {t('close')}
      </Button>
    );
  }

  if (retryingPayment) {
    return (
      <div className="flex w-full gap-2">
        <Button className={cn(buttonClassName, 'text-sm')} type="button" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? (
            <>
              {t('try_again')} <Icon name="reload" className="size-4 animate-spin" />
            </>
          ) : (
            t('try_again')
          )}
        </Button>
        <Button
          className={cn(buttonClassName, 'text-sm')}
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isRetrying}
        >
          {t('skip')}
        </Button>
      </div>
    );
  }

  /*
   * Out of retries. What used to stand here was "update your payment method",
   * and it is gone with the legacy Stripe form it opened: through the payments
   * service that step would change the card on the shared technical account's
   * subscription, which is not this member's card. ADR 0030 records the deletion.
   */
  return (
    <Button className={buttonClassName} type="button" onClick={onClose}>
      {t('skip')}
    </Button>
  );
}

export function UpsellPaymentMessage({
  onOpenChange,
  onDownloadPdf,
  open,
  isSuccess = false,
  retryCount,
  onRetry,
  onSuccessClose,
  isRetrying = false,
  product,
}: UpsellPaymentMessageProps) {
  const t = useTranslations('pages.reverse_lookup.report.upsell.payment_message');
  const router = useRouter();

  const retryingPayment = !isSuccess && retryCount < 3;

  const handleSuccess = () => {
    onOpenChange(false);

    /*
     * The entitlement is on the account, and the gates that read it are server
     * components — so the refresh is what makes the download button stop offering
     * the upsell the member has just bought. The download itself follows.
     */
    if (product === 'unlimited_pdf_downloads') {
      router.refresh();
      onDownloadPdf?.();
      return;
    }

    onSuccessClose?.();

    router.refresh();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={isSuccess ? handleSuccess : handleClose}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogTitle className="sr-only"></DialogTitle>
        <div className="flex flex-col items-center space-y-6">
          {isSuccess ? (
            <Image src="/images/upsell/payment-success.svg" alt="Success" width={160} height={160} />
          ) : (
            <Image src="/images/upsell/payment-error.svg" alt="Error" width={160} height={160} />
          )}
          <h3 className="text-center h3 font-bold">{isSuccess ? t('payment_success') : t('payment_error')}</h3>
          <p className="text-center">
            {isSuccess
              ? t('payment_success_description')
              : retryingPayment
                ? t('payment_retry_description')
                : t('payment_error_description')}
          </p>
          <UpsellPaymentMessageButtons
            isSuccess={isSuccess}
            retryingPayment={retryingPayment}
            onSuccess={handleSuccess}
            onRetry={onRetry}
            onClose={handleClose}
            isRetrying={isRetrying}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

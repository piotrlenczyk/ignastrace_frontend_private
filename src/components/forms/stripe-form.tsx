import { useElements, useStripe } from '@stripe/react-stripe-js';
import type { PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useSendOrderConfirmEmailMutation } from '@/app/[locale]/success/_hooks/api/use-send-order-confirm-email-mutation';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConfirmStripePaymentMutation } from '@/hooks/api/use-confirm-stripe-payment-mutation';
import { useCreateLegacyReverseLookupMutation } from '@/hooks/api/use-create-legacy-reverse-lookup-mutation';
import { useSession } from '@/hooks/use-session';
import { useRouter } from '@/libs/i18n-routing';
import type { StripeFormValues } from '@/types/stripe-form.types';

import WalletSubscriptionPayment from '../wallet-subscription-payment';
import { CreditCardForm } from './credit-card-form';

const StyledTabsTrigger = ({ value, children }: { value: string; children: React.ReactNode }) => {
  return (
    <TabsTrigger
      className={`
        h-14 border border-stroke-weak p-2 text-strong
        data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:bg-background
        data-[state=active]:text-strong
      `}
      value={value}
    >
      {children}
    </TabsTrigger>
  );
};

export const StripeForm = ({
  buttonText,
  currency,
  amount,
  isReactivate = false,
  isUpdatePaymentMethod = false,
  isSubmitting,
  routeToRedirect = '',
  setIsSubmitting,
  shouldSendOrderConfirmEmail = false,
  onPaymentMethodUpdated,
  isReverseLookupFunnel,
  phoneNumber,
}: {
  buttonText: string;
  currency: string;
  /** What falls due now, in minor units — the wallet sheet shows this figure. */
  amount: number;
  isReactivate?: boolean;
  isUpdatePaymentMethod?: boolean;
  isSubmitting: boolean;
  routeToRedirect?: string;
  setIsSubmitting: (isSubmitting: boolean) => void;
  shouldSendOrderConfirmEmail: boolean;
  onPaymentMethodUpdated?: () => void;
  isReverseLookupFunnel?: boolean;
  phoneNumber?: string;
}) => {
  const router = useRouter();
  const elements = useElements();

  const stripe = useStripe();
  const { session } = useSession();

  const t = useTranslations('components.forms.stripe_form');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [stripeError, setStripeError] = useState<string | undefined>();

  const { mutate: sendOrderConfirmEmail } = useSendOrderConfirmEmailMutation({
    onSuccess: () => {
      router.push(routeToRedirect);
    },
    onError: () => {
      router.push(routeToRedirect);
    },
  });

  const { mutate: createReverseLookup } = useCreateLegacyReverseLookupMutation({
    onSuccess: () => {
      router.push(routeToRedirect);
    },
    onError: () => {
      router.push(routeToRedirect);
    },
  });

  const { mutate: confirmStripePayment, isPending } = useConfirmStripePaymentMutation({
    stripe,
    onSuccess: () => {
      setIsRedirecting(true);

      if (isReactivate) {
        return location.reload();
      }

      if (isUpdatePaymentMethod) {
        return onPaymentMethodUpdated?.();
      }

      if (isReverseLookupFunnel && phoneNumber) {
        return createReverseLookup(phoneNumber);
      }

      if (shouldSendOrderConfirmEmail) {
        return sendOrderConfirmEmail();
      }

      router.push(routeToRedirect);
    },
    onError: () => {
      setIsRedirecting(false);
      setStripeError(t('errors.stripe_generic_error'));
      setIsSubmitting(false);
    },
  });

  const handleCreditCardSubmit = async (data: StripeFormValues) => {
    try {
      confirmStripePayment({
        data,
        email: session?.user.email || '',
        elements,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleWalletPayment = async (data: PaymentRequestPaymentMethodEvent) => {
    try {
      confirmStripePayment({
        data,
        email: session?.user.email || '',
        elements,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="card" className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3 gap-2 bg-transparent p-0">
        <StyledTabsTrigger value="card">
          <Icon name="credit-card" />
        </StyledTabsTrigger>

        <StyledTabsTrigger value="google_pay">
          <Image src="/images/payment-google.svg" width="58" height="40" alt="google pay" />
        </StyledTabsTrigger>

        <StyledTabsTrigger value="apple_pay">
          <Image src="/images/payment-apple.svg" width="58" height="40" alt="apple pay" />
        </StyledTabsTrigger>
      </TabsList>

      <TabsContent value="card">
        <CreditCardForm
          buttonText={buttonText}
          isSubmitDisabled={!stripe || isPending || isRedirecting || isSubmitting}
          onSubmit={handleCreditCardSubmit}
          setIsSubmitting={setIsSubmitting}
          stripeError={stripeError}
          setStripeError={setStripeError}
        />
      </TabsContent>

      <TabsContent value="apple_pay">
        <WalletSubscriptionPayment
          method="applePay"
          amount={amount}
          currency={currency}
          shouldLoad
          getWalletPaymentHandler={handleWalletPayment}
          validateInput={() => true}
        />
      </TabsContent>

      <TabsContent value="google_pay">
        <WalletSubscriptionPayment
          method="googlePay"
          amount={amount}
          currency={currency}
          shouldLoad
          getWalletPaymentHandler={handleWalletPayment}
          validateInput={() => true}
        />
      </TabsContent>
    </Tabs>
  );
};

import { useStripe } from '@stripe/react-stripe-js';
import type { PaymentRequest, PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import type { MouseEventHandler } from 'react';
import { useEffect, useState } from 'react';

import type { Product } from '@/app/[locale]/success/_types/product.type';
import type { Products } from '@/types/products';

import { WalletPaymentButton } from './wallet-payment-button';

const WALLET_COUNTRY = 'AE';

export default function WalletSubscriptionPayment({
  method,
  product,
  currency,
  useTrialPrice,
  shouldLoad,
  getWalletPaymentHandler,
  validateInput,
}: {
  method: string;
  product: Products | Product;
  currency: string;
  useTrialPrice: boolean;
  shouldLoad: boolean;
  getWalletPaymentHandler: (data: PaymentRequestPaymentMethodEvent) => void;
  validateInput?: () => boolean;
}) {
  const stripe = useStripe();

  const t = useTranslations('components.forms.stripe_form');

  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);

  const [isAvailable, setIsAvailable] = useState(false);

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    const createPaymentRequest = async () => {
      if (stripe) {
        const getAmount = () => {
          if ('price' in product) {
            // This is a Product (upsell) - single price
            return product.price;
          } else {
            // This is Products (subscription) - has trial and subscription prices
            return useTrialPrice ? product.trial_charge_price : product.subscription_price;
          }
        };

        const stripePaymentRequest = stripe.paymentRequest({
          requestPayerName: true,
          country: WALLET_COUNTRY,
          currency,
          total: {
            label: 'Total',
            amount: getAmount(),
          },
        });

        try {
          const canMakePaymentResult = await stripePaymentRequest.canMakePayment();
          setHasCheckedAvailability(true);
          if (canMakePaymentResult?.[method]) {
            setIsAvailable(true);
            setPaymentRequest(stripePaymentRequest);
          }
        } catch (error) {
          console.error('Error checking payment availability', error);
        }
      }
    };

    if (shouldLoad) {
      createPaymentRequest();
    }
  }, [shouldLoad, method, product, currency, setPaymentRequest, stripe, useTrialPrice]);

  useEffect(() => {
    const handlePaymentMethod = (event: PaymentRequestPaymentMethodEvent) => {
      getWalletPaymentHandler(event);
    };

    if (paymentRequest) {
      paymentRequest.on('paymentmethod', handlePaymentMethod);
      return () => {
        paymentRequest.off('paymentmethod', handlePaymentMethod);
      };
    } else {
      return () => {};
    }
  }, [getWalletPaymentHandler, paymentRequest]);

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();

    if (validateInput) {
      const isValid = validateInput();
      if (!isValid) {
        return;
      }
    }

    (paymentRequest as PaymentRequest).show();
  };

  return hasCheckedAvailability && !isAvailable ? (
    <div className="border border-stroke-weak p-2 text-strong">
      <h3 className="text-base font-medium">
        {method === 'googlePay' ? t('errors.google_pay_not_available') : t('errors.apple_pay_not_available')}
      </h3>
      <p className="text-sm">
        {method === 'googlePay'
          ? t('errors.google_pay_not_available_description')
          : t('errors.apple_pay_not_available_description')}
      </p>
    </div>
  ) : (
    <div className="flex flex-col gap-6">
      <WalletPaymentButton
        isLoading={!hasCheckedAvailability}
        onClick={handleButtonClick}
        method={method}
        disabled={!isAvailable}
      />
    </div>
  );
}

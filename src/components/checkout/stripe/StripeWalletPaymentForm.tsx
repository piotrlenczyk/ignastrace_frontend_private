import { ExpressCheckoutElement } from '@stripe/react-stripe-js';
import { type StripeExpressCheckoutElementReadyEvent } from '@stripe/stripe-js';
import { useState } from 'react';

import { useSettings } from '@/components/checkout/_shared/stubs/settings';
import { Spinner } from '@/components/ui/v2/spinner/spinner';

import { WalletForm } from '../WalletForm';

type StripeWalletPaymentFormProps = {
  provider: 'googlePay' | 'applePay';
  onConfirm: () => void;
  error?: string;
};

export const StripeWalletPaymentForm = ({ error, onConfirm, provider }: StripeWalletPaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [available, setAvailable] = useState<boolean | null>(null);

  const onReady = (event: StripeExpressCheckoutElementReadyEvent) => {
    setIsLoading(false);
    setAvailable(!!event.availablePaymentMethods?.[provider]);
  };

  const { expressCheckoutDisplayAutoEnabled } = useSettings();

  const paymentMethodOption = expressCheckoutDisplayAutoEnabled ? 'auto' : 'always';

  return (
    <WalletForm provider={provider} isUnavailable={!available && !isLoading} serverError={error}>
      <div className={`absolute inset-0 flex flex-col items-center justify-center`}>
        {isLoading ? <Spinner /> : null}

        <ExpressCheckoutElement
          onConfirm={onConfirm}
          onReady={onReady}
          options={{
            buttonTheme: {
              applePay: 'black',
              googlePay: 'black',
            },
            buttonType: {
              applePay: 'plain',
              googlePay: 'plain',
            },
            buttonHeight: 48,
            paymentMethods: {
              amazonPay: 'never',
              googlePay: provider === 'googlePay' ? paymentMethodOption : 'never',
              applePay: provider === 'applePay' ? paymentMethodOption : 'never',
              link: 'never',
              paypal: 'never',
            },
          }}
        />
      </div>
    </WalletForm>
  );
};

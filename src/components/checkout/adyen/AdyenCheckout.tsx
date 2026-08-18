'use client';

// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { useCheckout } from '../CheckoutProvider';
import { AdyenCardPayment } from './AdyenCardPayment';
import { AdyenCheckoutProvider } from './AdyenCheckoutProvider';
import { AdyenWalletPayment } from './AdyenWalletPayment';

export const AdyenCheckout = () => {
  const { product, paymentMethod, showGooglePay, handlePaymentSuccess } = useCheckout();
  const { providerAccount } = product.price;
  const clientKey = providerAccount.provider === 'adyen' ? providerAccount.clientKey : undefined;
  if (!clientKey) {
    return null;
  }

  return (
    <AdyenCheckoutProvider
      priceId={product.price.id}
      clientKey={clientKey}
      amount={{
        value: product.price.finalAmount,
        currency: product.price.currency,
      }}
    >
      {paymentMethod === 'card' ? <AdyenCardPayment product={product} onPaymentSuccess={handlePaymentSuccess} /> : null}
      {paymentMethod === 'applePay' ? (
        <AdyenWalletPayment provider="applePay" product={product} onPaymentSuccess={handlePaymentSuccess} />
      ) : null}
      {paymentMethod === 'googlePay' && showGooglePay ? (
        <AdyenWalletPayment provider="googlePay" product={product} onPaymentSuccess={handlePaymentSuccess} />
      ) : null}
    </AdyenCheckoutProvider>
  );
};

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';

import { type PaymentMethod, useCheckout } from './CheckoutProvider';

/*
 * One tile per method, in the order the design puts them. The wallet logos are
 * this repository's own payment artwork; the card tile is an icon rather than a
 * logo because no single brand stands for "a card".
 */
const METHOD_TILES = [
  { method: 'card', labelKey: 'card.label', image: undefined },
  { method: 'googlePay', labelKey: 'googlePay.label', image: '/images/payment-google.svg' },
  { method: 'applePay', labelKey: 'applePay.label', image: '/images/payment-apple.svg' },
] as const satisfies readonly { method: PaymentMethod; labelKey: string; image?: string }[];

/**
 * The three methods the island can take a payment with.
 *
 * Google Pay is hidden rather than offered-and-broken where the provider is
 * Adyen and its Google Pay switch is off, which is the one case the wallet
 * component cannot complete.
 */
export const SelectPaymentMethod = () => {
  const { paymentMethod, setPaymentMethod, showGooglePay } = useCheckout();
  const t = useTranslations('__NEW__.checkout.components.payments');

  const tiles = METHOD_TILES.filter((tile) => tile.method !== 'googlePay' || showGooglePay);

  return (
    <div className="flex gap-2">
      {tiles.map(({ method, labelKey, image }) => {
        const label = t(labelKey);

        return (
          <button
            key={method}
            type="button"
            aria-label={label}
            aria-pressed={paymentMethod === method}
            onClick={() => setPaymentMethod(method)}
            className={cn(
              'inline-flex h-14 flex-1 items-center justify-center rounded-lg ring-1 ring-stroke-weak',
              paymentMethod === method && 'ring-2 ring-primary',
            )}
          >
            {image ? (
              <Image src={image} alt={label} width={42} height={29} />
            ) : (
              <Icon name="credit-card" className="text-2xl text-strong" />
            )}
          </button>
        );
      })}
    </div>
  );
};

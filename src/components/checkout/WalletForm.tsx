'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

type WalletProvider = 'applePay' | 'googlePay';

const PROVIDER_CONFIG = {
  applePay: {
    labelKey: 'applePay.label',
    icon: '/payments/applePay.svg',
    alt: 'Apple Pay',
    width: 42,
    height: 18,
  },
  googlePay: {
    labelKey: 'googlePay.label',
    icon: '/payments/googlePay.svg',
    alt: 'Google Pay',
    width: 42,
    height: 18,
  },
} as const;

type WalletFormProps = {
  children: ReactNode;
  provider: WalletProvider;
  isUnavailable: boolean;
  serverError?: string;
};

export const WalletForm = ({ children, provider, isUnavailable, serverError }: WalletFormProps) => {
  const t = useTranslations('__NEW__.checkout.components.payments');
  const config = PROVIDER_CONFIG[provider];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p>{t(config.labelKey)}</p>
        <Image src={config.icon} width={config.width} height={config.height} alt={config.alt} />
      </div>
      <div className="relative min-h-12">
        {children}
        {isUnavailable ? <p className="text-center font-semibold">{t('notSupported')}</p> : null}
      </div>

      {serverError ? (
        // <div className="bg-fill-error-weak flex rounded-lg p-4">
        <div className="flex rounded-lg p-4">
          <p className="text-error">{serverError}</p>
        </div>
      ) : null}
    </div>
  );
};

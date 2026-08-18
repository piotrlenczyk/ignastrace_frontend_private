'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { type FormEvent, type ReactNode, type RefObject } from 'react';

import { useSettings } from '@/components/checkout/_shared/stubs/settings';
import { Button } from '@/components/checkout/_shared/ui/Button';
import { Input } from '@/components/checkout/_shared/ui/Input';
import { Spinner } from '@/components/checkout/_shared/ui/Spinner';
import { Text } from '@/components/checkout/_shared/ui/Text';

import { type CardFieldErrors } from './cardForm.types';
import { useCheckout } from './CheckoutProvider';

type CardFormProps = {
  children: ReactNode;
  isFieldsLoading: boolean;
  submitButtonRef?: RefObject<HTMLButtonElement | null>;
  isSubmitLoading: boolean;
  isSubmitDisabled: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  fieldErrors: CardFieldErrors;
  serverError?: string;
  zipCode: string;
  onZipCodeChange: (value: string) => void;
};

export const CardForm = ({
  children,
  isFieldsLoading,
  submitButtonRef,
  isSubmitLoading,
  isSubmitDisabled,
  onSubmit,
  fieldErrors,
  serverError,
  zipCode,
  onZipCodeChange,
}: CardFormProps) => {
  const settings = useSettings();
  const t = useTranslations('__NEW__.checkout.CheckoutPage');
  const tCard = useTranslations('__NEW__.checkout.components.payments.card');
  const { isCoverLetter } = useCheckout();

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Text variant="bodyLarge">{tCard('label')}</Text>
          <div className="flex gap-2">
            <Image src="/payments-border/visa.svg" width={34} height={24} alt="Visa" />
            <Image src="/payments-border/mastercard.svg" width={34} height={24} alt="Mastercard" />
            <Image src="/payments-border/amex.svg" width={34} height={24} alt="Amex" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative">
            {isFieldsLoading && (
              <div
                className={`
                  absolute inset-0 flex flex-col items-center justify-center
                `}
              >
                <Spinner className="size-5 text-brand" />
              </div>
            )}
            {children}
          </div>
        </div>

        {settings.checkoutZipCodeEnabled ? (
          <Input
            type="text"
            placeholder={tCard('zipCode.placeholder')}
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
          />
        ) : null}
        {fieldErrors.numberError || fieldErrors.expiryError || fieldErrors.cvcError ? (
          <div className="flex flex-col">
            {fieldErrors.numberError ? (
              <Text variant="caption" color="error">
                {fieldErrors.numberError}
              </Text>
            ) : null}
            {fieldErrors.expiryError ? (
              <Text variant="caption" color="error">
                {fieldErrors.expiryError}
              </Text>
            ) : null}
            {fieldErrors.cvcError ? (
              <Text variant="caption" color="error">
                {fieldErrors.cvcError}
              </Text>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button
        ref={submitButtonRef as React.ForwardedRef<HTMLButtonElement>}
        type="submit"
        className="w-full"
        size="lg"
        loading={isSubmitLoading}
        disabled={isSubmitDisabled || isFieldsLoading}
      >
        {isCoverLetter ? t('getMyCoverLetter') : t('getMyResume')}
      </Button>

      {serverError ? (
        <div className="flex rounded-lg bg-fill-error-weak p-4">
          <Text className="text-error">{serverError}</Text>
        </div>
      ) : null}
    </form>
  );
};

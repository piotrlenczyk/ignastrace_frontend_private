'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { type FormEvent, type ReactNode, type RefObject } from 'react';

import { useSettings } from '@/settings/settings.provider';

import { Input } from '../ui/input';
import { ButtonV2 } from '../ui/v2/button';
import { Spinner } from '../ui/v2/spinner/spinner';
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
  const tCard = useTranslations('__NEW__.checkout.components.payments.card');
  const { submitLabel } = useCheckout();

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p>{tCard('label')}</p>
          <div className="flex gap-2">
            <Image src="/images/payment-visa.svg" width={34} height={24} alt="Visa" />
            <Image src="/images/payment-mastercard.svg" width={34} height={24} alt="Mastercard" />
            <Image src="/images/payment-amex.svg" width={34} height={24} alt="Amex" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative">
            {isFieldsLoading && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center`}>
                <Spinner />
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
            {fieldErrors.numberError ? <p className="text-caption text-error">{fieldErrors.numberError}</p> : null}
            {fieldErrors.expiryError ? <p className="text-caption text-error">{fieldErrors.expiryError}</p> : null}
            {fieldErrors.cvcError ? <p className="text-caption text-error">{fieldErrors.cvcError}</p> : null}
          </div>
        ) : null}
      </div>

      <ButtonV2
        ref={submitButtonRef as React.ForwardedRef<HTMLButtonElement>}
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitDisabled || isFieldsLoading || isSubmitLoading}
      >
        {submitLabel}
      </ButtonV2>

      {serverError ? (
        <div className="flex rounded-lg bg-error p-4">
          <p className="text-error">{serverError}</p>
        </div>
      ) : null}
    </form>
  );
};

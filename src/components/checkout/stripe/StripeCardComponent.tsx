'use client';

import { CardCvcElement, CardExpiryElement, CardNumberElement, useElements } from '@stripe/react-stripe-js';
import {
  type StripeCardCvcElementChangeEvent,
  type StripeCardExpiryElementChangeEvent,
  type StripeCardExpiryElementOptions,
  type StripeCardNumberElementChangeEvent,
} from '@stripe/stripe-js';
import { useRef } from 'react';

import { cn } from '@/libs/utils';

import { type CardFieldErrors } from '../cardForm.types';

const options: StripeCardExpiryElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
      color: '#0b0a0aa6',
      '::placeholder': {
        color: '#000D4D73',
      },
    },
  },
};

type StripeCardComponentProps = {
  isLoading?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  onFieldErrorsChange?: (errors: CardFieldErrors) => void;
};

export const StripeCardComponent = ({ isLoading, onLoadingChange, onFieldErrorsChange }: StripeCardComponentProps) => {
  const elements = useElements();
  const errorsRef = useRef<CardFieldErrors>({
    numberError: '',
    expiryError: '',
    cvcError: '',
  });

  const updateError = (field: keyof CardFieldErrors, message: string) => {
    errorsRef.current = { ...errorsRef.current, [field]: message };
    onFieldErrorsChange?.({ ...errorsRef.current });
  };

  const handleCardNumberChange = (e: StripeCardNumberElementChangeEvent) => {
    updateError('numberError', e.error?.message || '');
    if (e.complete && elements) {
      const cardExpiryElement = elements.getElement(CardExpiryElement);
      cardExpiryElement?.focus();
    }
  };

  const handleCardExpiryChange = (e: StripeCardExpiryElementChangeEvent) => {
    updateError('expiryError', e.error?.message || '');
    if (e.complete && elements) {
      const cardCvcElement = elements.getElement(CardCvcElement);
      cardCvcElement?.focus();
    }
  };

  const handleCardCvcChange = (e: StripeCardCvcElementChangeEvent) => {
    updateError('cvcError', e.error?.message || '');
  };

  return (
    <div
      className={`
        relative flex flex-col gap-2
        md:flex-row
      `}
    >
      <div className="flex flex-3 flex-col gap-1">
        <CardNumberElement
          options={{
            ...options,
            placeholder: '1234 1234 1234 1234',
          }}
          onReady={() => setTimeout(() => onLoadingChange?.(false), 200)}
          className={cn('stripeInput', isLoading && 'opacity-0')}
          onChange={handleCardNumberChange}
        />
      </div>
      <div className="flex flex-2 gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <CardExpiryElement
            options={options}
            className={cn('stripeInput', isLoading && 'opacity-0')}
            onChange={handleCardExpiryChange}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <CardCvcElement
            options={options}
            className={cn('stripeInput', isLoading && 'opacity-0')}
            onChange={handleCardCvcChange}
          />
        </div>
      </div>
    </div>
  );
};

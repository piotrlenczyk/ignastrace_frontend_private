import { zodResolver } from '@hookform/resolvers/zod';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from '@stripe/react-stripe-js';
import type {
  StripeCardElementOptions,
  StripeElementStyle,
} from '@stripe/stripe-js';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { IconLoaderCircle } from '@/components/ui/icon/icons';
import { Input } from '@/components/ui/input';
import { COUNTRIES_REQUESTING_ZIP } from '@/constants/countries';
import { useCountry } from '@/hooks/useCountry';
import { stripeCreditCardSchema, type StripeFormValues } from '@/types/stripe-form.types';

const cardStyle: StripeElementStyle = {
  base: {
    'fontSize': '16px',
    'color': '#2A2D3B',
    'lineHeight': '24px',
    '::placeholder': {
      color: '#6F727A',
    },
  },
  invalid: {
    color: '#2A2D3B',
  },
};

const options: StripeCardElementOptions = {
  style: cardStyle,
};

const StyledInputs = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="rounded-lg border border-input bg-white px-4 py-3
        ring-offset-2 transition-colors hover:bg-gray-50"
    >
      {children}
    </div>
  );
};

export const CreditCardForm = ({
  buttonText,
  isSubmitDisabled,
  onSubmit,
  setIsSubmitting,
  stripeError,
  setStripeError,
}: {
  buttonText: string;
  isSubmitDisabled: boolean;
  onSubmit: (data: StripeFormValues) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  stripeError: string | undefined;
  setStripeError: (stripeError: string | undefined) => void;
}) => {
  const t = useTranslations('components.forms.stripe_form');
  const form = useForm<StripeFormValues>({
    resolver: zodResolver(stripeCreditCardSchema(t)),
    defaultValues: {
      cardName: '',
      zipCode: '',
    },
  });

  const [cardNumberError, setCardNumberError] = useState<string | undefined>(t('errors.card_number_required'));
  const [expirationDateError, setExpirationDateError]
    = useState<string | undefined>(t('errors.expiration_date_required'));
  const [cvcError, setCvcError] = useState<string | undefined>(t('errors.cvc_required'));
  const [elementsReady, setElementsReady] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });

  const country = useCountry();
  const showZipCode = process.env.NEXT_PUBLIC_REQUEST_ZIP === 'true'
    && COUNTRIES_REQUESTING_ZIP.includes(country.toUpperCase());

  const handlePreSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    form.clearErrors();
    setStripeError(undefined);

    let hasErrors = false;

    if (!form.getValues('cardName')) {
      form.setError('cardName', { message: t('errors.card_name_required') });
      hasErrors = true;
    } else if (!form.getValues('cardName').match(/^\D+$/)) {
      form.setError('cardName', { message: t('errors.name_invalid_characters') });
      hasErrors = true;
    } else if (form.getValues('cardName')?.match(/[!@#$%^&*()_+=[\]{};:"\\|,.<>/?]/)) {
      form.setError('cardName', { message: t('errors.name_invalid_special_characters') });
      hasErrors = true;
    }

    if (cardNumberError) {
      form.setError('cardNumber', { message: cardNumberError });
      hasErrors = true;
    }

    if (expirationDateError) {
      form.setError('expirationDate', { message: expirationDateError });
      hasErrors = true;
    }

    if (cvcError) {
      form.setError('cvc', { message: cvcError });
      hasErrors = true;
    }

    const zipCodeValue = form.getValues('zipCode');
    if (showZipCode && zipCodeValue && zipCodeValue.trim() !== '') {
      const trimmedZip = zipCodeValue.trim();
      if (!/^\d{5}(-\d{4})?$/.test(trimmedZip)) {
        form.setError('zipCode', { message: t('errors.zip_code_invalid_format') });
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      await form.handleSubmit(onSubmit)(e);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleElementReady = (elementType: keyof typeof elementsReady) => {
    setElementsReady(prev => ({
      ...prev,
      [elementType]: true,
    }));
  };

  const isLoading = useMemo(() => !Object.values(elementsReady).every(Boolean), [elementsReady]);

  return (
    <Form {...form}>
      { isLoading
      && (
        <div className="
         absolute inset-0 z-[100] mt-0! grid animate-fade-in
         place-items-center content-center bg-white/80 text-center"
        >
          <IconLoaderCircle size="large" className="animate-spin text-primary" />
        </div>
      )}
      <form onSubmit={handlePreSubmit} className="grid grid-cols-4 gap-4 sm:gap-2">
        <FormField
          control={form.control}
          name="cardName"
          render={({ field }) => (
            <FormItem className="col-span-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-normal text-strong">{t('credit_card_label')}</FormLabel>
                <div className="flex justify-center gap-2">
                  <Image src="/images/payment-visa.svg" width="34" height="24" alt="VISA" />
                  <Image src="/images/payment-mastercard.svg" width="34" height="24" alt="Mastercard" />
                  <Image src="/images/payment-amex.svg" width="34" height="24" alt="AMEX" />
                </div>
              </div>
              <FormControl>
                <Input
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={t('card_name_placeholder')}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    form.clearErrors('cardName');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cardNumber"
          render={() => (
            <FormItem className="col-span-4">
              <FormControl>
                <StyledInputs>
                  <CardNumberElement
                    className="min-h-[26px]"
                    options={{ ...options, placeholder: t('credit_card_placeholder') }}
                    onChange={(event) => {
                      form.clearErrors('cardNumber');
                      if (event.complete) {
                        setCardNumberError(undefined);
                      } else if (event.empty) {
                        setCardNumberError(t('errors.card_number_required'));
                      } else {
                        setCardNumberError(event.error?.message);
                      }
                    }}
                    onReady={() => handleElementReady('cardNumber')}
                  />
                </StyledInputs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expirationDate"
          render={() => (
            <FormItem className="col-span-2">
              <FormControl>
                <StyledInputs>
                  <CardExpiryElement
                    className="min-h-[26px]"
                    options={{ ...options, placeholder: t('expiration_date_placeholder') }}
                    onChange={(event) => {
                      form.clearErrors('expirationDate');
                      if (event.complete) {
                        setExpirationDateError(undefined);
                      } else if (event.empty) {
                        setExpirationDateError(t('errors.expiration_date_required'));
                      } else {
                        setExpirationDateError(event.error?.message);
                      }
                    }}
                    onReady={() => handleElementReady('cardExpiry')}
                  />
                </StyledInputs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cvc"
          render={() => (
            <FormItem className="col-span-2">
              <FormControl>
                <StyledInputs>
                  <CardCvcElement
                    className="min-h-[26px]"
                    options={{ ...options, placeholder: t('cvc_placeholder') }}
                    onChange={(event) => {
                      form.clearErrors('cvc');
                      if (event.complete) {
                        setCvcError(undefined);
                      } else if (event.empty) {
                        setCvcError(t('errors.cvc_required'));
                      } else {
                        setCvcError(event.error?.message);
                      }
                    }}
                    onReady={() => handleElementReady('cardCvc')}
                  />
                </StyledInputs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        { showZipCode && (
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem className="col-span-4">
                <FormControl>
                  <Input
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder={t('zip_code_placeholder')}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.clearErrors('zipCode');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) }

        {
          stripeError && (
            <div className="col-span-4 mb-1 mt-5 text-sm text-error">
              {stripeError}
            </div>
          )
        }

        <Button
          type="submit"
          size="xl"
          disabled={isLoading || isSubmitDisabled}
          className="col-span-4 mt-2 w-full sm:mt-4"
        >
          {buttonText}
        </Button>
      </form>
    </Form>
  );
};

'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CountryCode } from 'libphonenumber-js';
import parsePhoneNumber from 'libphonenumber-js';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { saveFunnelPhone } from '@/actions/funnel-phone-number';
import { saveFunnelPlan } from '@/actions/funnel-plan';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ROUTES } from '@/constants/routes';
import { useConsent } from '@/hooks/use-consent';
import { useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import {
  createPhoneFormSchema,
  type PhoneFormValues,
} from '@/types/phone-form.types';

import { Button } from '../ui/button';
import { ConsentModal } from '../ui/consent-modal';
import { IconLoaderCircle, IconLocationMy } from '../ui/icon/icons';
import { PhoneInput as PhoneInputBase } from '../ui/phone-input/index';

export const PhoneInput = ({
  className,
  defaultCountry,
  destinationUrl = ROUTES.LOADER,
  hasLgBackground = true,
}: {
  className?: string;
  defaultCountry: CountryCode;
  destinationUrl?: string;
  hasLgBackground?: boolean;
}) => {
  const lgBackground = hasLgBackground && `phone-input-lg`;

  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') === 'subscription' ? 'subscription' : 'trial';
  const t = useTranslations('components.phone_input');
  const { shouldShowConsent, setConsentGiven } = useConsent();

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(createPhoneFormSchema(t)),
    defaultValues: {
      phone: '',
    },
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [data, setData] = useState<PhoneFormValues | null>(null);

  const handleSubmit = async (formData: PhoneFormValues) => {
    setIsSubmitting(true);
    try {
      const phoneNumber = parsePhoneNumber(formData.phone);
      setData(formData);

      // Check if consent is needed for US users
      // Note: This component is used on public pages, so we assume user is not authenticated
      if (phoneNumber?.country === 'US' && shouldShowConsent) {
        setShowConsentModal(true);
        setIsSubmitting(false);
        return;
      }

      // For non-US users or when consent is already given, proceed directly
      setIsAgreed(true);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      form.setError('phone', {
        type: 'server',
        message: t('errors.invalid_phone'),
      });
    }
  };
  const handleConsentAccept = () => {
    setConsentGiven(true);
    setShowConsentModal(false);
    setIsAgreed(true);
  };

  const handleConsentDecline = () => {
    setShowConsentModal(false);
    setIsSubmitting(false);
    form.reset();
  };

  useEffect(() => {
    if (isAgreed && data) {
      const proceed = async (formData: PhoneFormValues) => {
        await saveFunnelPhone(formData.phone);
        await saveFunnelPlan(plan);
        router.push(destinationUrl);
      };
      proceed(data as PhoneFormValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgreed, data]);

  return (
    <>
      {showConsentModal && (
        <ConsentModal
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn('phone-input', lgBackground, className)}
        >
          <div className="phone-input-form">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInputBase
                      value={field.value}
                      onChange={formattedPhone =>
                        field.onChange(formattedPhone)}
                      defaultCountry={defaultCountry}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          {form.formState.errors.phone && (
            <div className="mt-1 text-sm font-medium text-destructive md:hidden">
              {form.formState.errors.phone.message}
            </div>
          )}
          <Button type="submit" size="xl" disabled={isSubmitting}>
            {isSubmitting
              ? (
                  <IconLoaderCircle size="large" className="animate-spin" />
                )
              : (
                  <IconLocationMy size="large" />
                )}
            {t('submit')}
          </Button>
        </form>
      </Form>
      {form.formState.errors.phone && (
        <div className="mt-2 hidden text-sm font-medium text-destructive md:block">
          {form.formState.errors.phone.message}
        </div>
      )}
    </>
  );
};

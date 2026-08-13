'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { saveFunnelPhone } from '@/actions/funnel-phone-number';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { IconLoaderCircle, IconLocationMy } from '@/components/ui/icon/icons';
import { PhoneInput as PhoneInputBase } from '@/components/ui/phone-input/index';
import { ROUTES } from '@/constants/routes';
import { clearSummaryTimer } from '@/hooks/use-timer-utils';
import { useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import { createPhoneFormSchema, type PhoneFormValues } from '@/types/phone-form.types';

export const PhoneInput = ({
  className,
  defaultCountry,
  destinationUrl = ROUTES.REVERSE_LOOKUP.SEARCH,
  hasLgBackground = true,
}: {
  className?: string;
  defaultCountry: CountryCode;
  destinationUrl?: string;
  hasLgBackground?: boolean;
}) => {
  const lgBackground = hasLgBackground && `phone-input-lg`;

  const router = useRouter();
  const t = useTranslations('pages.reverse_lookup.components.phone_input');

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(createPhoneFormSchema(t)),
    defaultValues: {
      phone: '',
    },
    mode: 'onSubmit',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PhoneFormValues) => {
    setIsSubmitting(true);
    try {
      clearSummaryTimer();
      await saveFunnelPhone(data.phone);
      router.push(destinationUrl);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      form.setError('phone', {
        type: 'server',
        message: t('errors.invalid_phone'),
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('phone-input', lgBackground, className)}>
          <div className="phone-input-form">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInputBase
                      onChange={(formattedPhone) => field.onChange(formattedPhone)}
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
          <Button type="submit" size="xl" className="min-w-40" disabled={isSubmitting}>
            {isSubmitting ? (
              <IconLoaderCircle size="large" className="animate-spin" />
            ) : (
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

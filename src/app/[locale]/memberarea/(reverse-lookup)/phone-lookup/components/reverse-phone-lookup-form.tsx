'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CountryCode } from 'libphonenumber-js';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { saveFunnelPhone } from '@/actions/funnel-phone-number';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { IconLoaderCircle, IconLocationMy } from '@/components/ui/icon/icons';
import { PhoneInput as PhoneInputBase } from '@/components/ui/phone-input/index';
import { ROUTES } from '@/constants/routes';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { createPhoneFormSchema, type PhoneFormValues } from '@/types/phone-form.types';
import type { ReverseLookupCompact } from '@/types/reverse-lookup.types';

import { useCreateReverseLookupMutation } from '../hooks/api/use-create-reverse-lookup-mutation';

export const ReversePhoneLookupForm = ({ country }: { country: CountryCode }) => {
  const router = useRouter();
  const t = useTranslations('pages.reverse_lookup.components.phone_input');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const showErrorToastWithMessage = useMessageErrorToast();

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(createPhoneFormSchema(t)),
    defaultValues: {
      phone: '',
    },
    mode: 'onSubmit',
  });

  const { mutate: createReverseLookup } = useCreateReverseLookupMutation({
    onSuccess: async (reverseLookup: ReverseLookupCompact) => {
      await saveFunnelPhone(form.getValues('phone'));
      router.push(`${ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.PROGRESS}?id=${reverseLookup.id}`);
    },
    onError: (error) => {
      if (error.status === 429) {
        showErrorToastWithMessage(t('errors.rate_limit_exceeded'), t('errors.rate_limit_exceeded_title'));
      } else {
        form.setError('phone', {
          type: 'server',
          message: t('errors.invalid_phone'),
        });
      }
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (data: PhoneFormValues) => {
    setIsSubmitting(true);
    createReverseLookup(data.phone);
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="phone-input"
        >
          <div className="phone-input-form">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInputBase
                      onChange={formattedPhone => field.onChange(formattedPhone)}
                      defaultCountry={country}
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

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
import { Icon } from '@/components/ui/icon';
import { PhoneInput as PhoneInputBase } from '@/components/ui/phone-input/index';
import { ROUTES } from '@/constants/routes';
import { useCreateReverseLookupMutation } from '@/hooks/api/use-create-reverse-lookup-mutation';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { createPhoneFormSchema, type PhoneFormValues } from '@/types/phone-form.types';

import { isReportLimitRefusal } from '../report-creation-limit';

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

  /*
   * The two branches a refusal can be. A spent daily allowance is the one the
   * member can act on, so it gets its own toast; everything else lands on the
   * field, where a mistyped number is the likeliest cause. The allowance is
   * recognised by the API's own error code and never by the status — the module
   * beside this one is where the two codes it can arrive as live.
   */
  const { mutate: createReverseLookup } = useCreateReverseLookupMutation({
    onSuccess: async (reportId) => {
      await saveFunnelPhone(form.getValues('phone'));
      router.push(`${ROUTES.REVERSE_LOOKUP.MEMBER.PHONE_LOOKUP.PROGRESS}?id=${reportId}`);
    },
    onError: (refusal) => {
      if (isReportLimitRefusal(refusal)) {
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="phone-input">
          <div className="phone-input-form">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInputBase
                      onChange={(formattedPhone) => field.onChange(formattedPhone)}
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
            {isSubmitting ? <Icon name="reload" className="animate-spin" /> : <Icon name="location" />}
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { saveFunnelPhone } from '@/actions/funnel-phone-number';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Icon } from '@/components/ui/icon';
import { ButtonV2 } from '@/components/ui/v2/button';
import { PhoneFieldV2 } from '@/components/ui/v2/phone-field';
import { ROUTES } from '@/constants/routes';
import { clearSummaryTimer } from '@/hooks/use-timer-utils';
import { useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import { createPhoneFormSchema, type PhoneFormValues } from '@/types/phone-form.types';

/*
 * Restyle of _components/phoneInput.tsx (CTA form 10047:17509).
 *
 * The submit path is carried over verbatim — same schema, same `clearSummaryTimer`
 * then `saveFunnelPhone` then `router.push(destinationUrl)`, same server-error
 * fallback onto the `phone` field, same default destination.
 *
 * The layout reflows rather than duplicating: the design keeps the button inside
 * the bordered row on desktop and drops it to a full-width block below the field on
 * mobile, so the border and padding move to the outer element at `lg`.
 */
export const LookupForm = ({
  className,
  defaultCountry,
  destinationUrl = ROUTES.REVERSE_LOOKUP.SEARCH,
}: {
  className?: string;
  defaultCountry: CountryCode;
  destinationUrl?: string;
}) => {
  const router = useRouter();
  const t = useTranslations('__NEW__.reverse_lookup.hero');

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(createPhoneFormSchema(t)),
    defaultValues: { phone: '' },
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
      form.setError('phone', { type: 'server', message: t('errors.invalid_phone') });
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={`
            flex flex-col gap-3
            lg:h-16 lg:flex-row lg:items-center lg:gap-4 lg:rounded-md lg:border lg:border-border-primary
            lg:bg-bg-primary lg:p-2
          `}
        >
          <div
            className={`
              flex items-center rounded-md border border-border-primary bg-bg-primary p-2
              lg:min-w-px lg:flex-1 lg:rounded-none lg:border-0 lg:p-0
            `}
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <PhoneFieldV2
                      onChange={(formattedPhone) => field.onChange(formattedPhone)}
                      defaultCountry={defaultCountry}
                      placeholder={t('placeholder')}
                      /*
                       * The divider between the country selector and the input is a
                       * right border on the country cell in the design, so it is
                       * drawn by the selector's sibling rather than a spacer node.
                       */
                      className="
                        divide-x divide-border-primary
                        [&>button]:mr-2 [&>button]:border-r [&>button]:border-border-primary [&>button]:pr-3
                      "
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <ButtonV2 type="submit" size="xl" disabled={isSubmitting} className="w-full gap-1.5 px-8 lg:w-auto">
            {isSubmitting ? (
              <Icon name="reload" className="size-5 animate-spin" />
            ) : (
              <Icon name="search" className="size-5" />
            )}
            {t('submit')}
          </ButtonV2>
        </form>
      </Form>

      {form.formState.errors.phone && (
        <p className="mt-2 font-body text-sm-medium text-text-error-primary">{form.formState.errors.phone.message}</p>
      )}
    </div>
  );
};

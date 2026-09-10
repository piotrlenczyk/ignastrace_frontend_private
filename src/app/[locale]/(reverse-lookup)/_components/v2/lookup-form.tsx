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
import { PhoneCtaFormV2 } from '@/components/ui/v2/phone-cta-form';
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
 * The field, its border, the country divider and the error message are all
 * `PhoneCtaFormV2` — the whole `CTA From` component set. The only thing left here
 * is the mobile submit button: the set's desktop frame carries the button inside
 * the field (which the component renders, `hidden lg:inline-flex`) and its mobile
 * frame carries none at all, so placing the mobile one belongs to the screen.
 *
 * Both buttons are `type="submit"` on the same form and exactly one is ever
 * visible, so Enter and click reach the same handler at either breakpoint.
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <PhoneCtaFormV2
                    onChange={(formattedPhone) => field.onChange(formattedPhone)}
                    defaultCountry={defaultCountry}
                    placeholder={t('placeholder')}
                    submitLabel={t('submit')}
                    loading={isSubmitting}
                    error={form.formState.errors.phone?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <ButtonV2
            type="submit"
            size="xl"
            loading={isSubmitting}
            iconLeading={<Icon name="search" />}
            className="w-full px-8 lg:hidden"
          >
            {t('submit')}
          </ButtonV2>
        </form>
      </Form>
    </div>
  );
};

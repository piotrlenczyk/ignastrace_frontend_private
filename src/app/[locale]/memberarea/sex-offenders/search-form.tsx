'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { US_STATES } from '@/constants/us-states';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { useRouter } from '@/libs/i18n-routing';
import { useCreateSexOffenderSearchMutation } from '@/network/api/hooks/use-create-sex-offender-search-mutation';

import {
  createSexOffenderSearchSchema,
  SEARCH_ALL_STATES,
  sexOffenderSearchBody,
  type SexOffenderSearchFormValues,
} from './types/search.types';

export const SexOffenderSearchForm = () => {
  const t = useTranslations('pages.sex_offenders_search.form');
  const tLoading = useTranslations('pages.sex_offenders_search.loading');
  const router = useRouter();
  const showErrorToast = useGenericErrorToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<SexOffenderSearchFormValues>({
    resolver: zodResolver(createSexOffenderSearchSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      city: '',
      state: SEARCH_ALL_STATES,
      zipCode: '',
    },
  });

  const { mutate, isPending } = useCreateSexOffenderSearchMutation();

  const handleSubmit = (values: SexOffenderSearchFormValues) => {
    mutate(
      { body: sexOffenderSearchBody(values) },
      {
        onSuccess: (search) => {
          setIsRedirecting(true);
          router.push(`${ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.RESULTS}?id=${search.id}`);
        },
        /* A provider outage keeps the generic toast this form has always shown. */
        onError: () => showErrorToast(),
      },
    );
  };

  if (isPending || isRedirecting) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <div className="globe mb-4">
          <div className="globe-map" />
        </div>
        <h2 className="h4 font-bold">{tLoading('title')}</h2>
        <p className="text-weak">{tLoading('subtitle')}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <h2 className="h3 font-bold">{t('title')}</h2>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{t('first_name_placeholder')}</FormLabel>
                <FormControl>
                  <Input className="h-14 border-primary" placeholder={t('first_name_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{t('last_name_placeholder')}</FormLabel>
                <FormControl>
                  <Input className="h-14 border-primary" placeholder={t('last_name_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{t('city_placeholder')}</FormLabel>
              <FormControl>
                <Input className="h-14 border-primary" placeholder={t('city_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{t('state_placeholder')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-14 border-primary">
                      <SelectValue placeholder={t('state_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SEARCH_ALL_STATES}>{t('state_placeholder')}</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{t('zip_placeholder')}</FormLabel>
                <FormControl>
                  <Input className="h-14 border-primary" placeholder={t('zip_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          <Icon name="scan" className="mr-2" />
          {t('submit_button')}
        </Button>
      </form>
    </Form>
  );
};

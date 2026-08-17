'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { cn } from '@/libs/utils';
import { actionCreateLinkLocationRequest } from '@/server/actions/location-request.actions';

import { type CreateLinkFormValues, createLinkLocationSchema } from './types/create-link.types';

export const CreateCustomLinkForm = ({ className }: { className?: string }) => {
  const t = useTranslations('pages.find_by_link.form');
  const showErrorToast = useGenericErrorToast();

  const form = useForm<CreateLinkFormValues>({
    resolver: zodResolver(createLinkLocationSchema(t)),
    defaultValues: {
      name: '',
    },
  });

  /*
   * There is no success branch: the action navigates to the screen that shows the
   * Share link, so the only thing left for the form to do is say when the API
   * refused. Nothing on this screen distinguishes one refusal from another, so
   * every one of them is the generic message.
   */
  const { execute, isPending } = useAction(actionCreateLinkLocationRequest, {
    onError: () => {
      showErrorToast();
    },
  });

  const handleSubmit = (data: CreateLinkFormValues) => {
    execute({ linkName: data.name });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-3', className)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('linkLabel')}</FormLabel>
              <div className="input-animated-border rounded-lg">
                <FormControl>
                  <Input className="phone-input-input h-14 border-0" placeholder={t('linkPlaceholder')} {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {t('submitButton')}
        </Button>
      </form>
    </Form>
  );
};

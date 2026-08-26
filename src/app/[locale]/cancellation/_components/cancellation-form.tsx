'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { toast } from '@/hooks/use-toast';
import { actionCancelSubscriptionByEmail } from '@/server/actions/subscription.actions';
import { isAccountNotFoundActionError } from '@/server/lib/auth-action-error';
import { isHttpClientActionError } from '@/server/lib/safe-action';

import { type CancellationFormValues, createCancellationFormSchema } from '../_types/cancellation.types';

export const CancellationForm = () => {
  const t = useTranslations('pages.cancellation.form');
  const showErrorToast = useGenericErrorToast();

  const form = useForm<CancellationFormValues>({
    resolver: zodResolver(createCancellationFormSchema(t)),
    defaultValues: {
      email: '',
    },
  });

  const { execute, isPending } = useAction(actionCancelSubscriptionByEmail, {
    onSuccess: () => {
      form.reset();
      toast({
        title: t('success_title'),
        description: t('success_description'),
        variant: 'success',
      });
    },
    /*
     * The two failures the member can act on, and no status read for either. The
     * cancellation happens in two calls against two services: the API is asked
     * whether the address has an account, and the payments service is asked to
     * cancel the subscription behind it.
     *
     * The API's refusal is read off its own `errorCode`, as everything on this
     * side is. The payments service's is read off `source`, because that service
     * publishes no codes at all and the endpoint this calls declares no failure
     * whatsoever in its specification — so there is nothing else about it to
     * branch on, and a status would be an assertion about an undocumented
     * refusal. Anything neither of them recognises is the generic message.
     */
    onError: ({ error: { serverError } }) => {
      if (isAccountNotFoundActionError(serverError)) {
        toast({
          title: t('error_not_found_title'),
          description: t('error_not_found_description'),
          variant: 'destructive',
        });

        return;
      }

      if (isHttpClientActionError(serverError) && serverError.data.source === 'payments-api') {
        toast({
          description: t('error_not_subscribed_title'),
          variant: 'destructive',
        });

        return;
      }

      showErrorToast();
    },
  });

  const onSubmit = (data: CancellationFormValues) => {
    execute(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email_label')}</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={isPending}>
          {t('submit')}
        </Button>
      </form>
    </Form>
  );
};

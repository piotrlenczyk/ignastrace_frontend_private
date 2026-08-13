'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { toast } from '@/hooks/use-toast';
import { useRouter } from '@/libs/i18n-routing';

import { useCancellationMutation } from '../_hooks/api/use-my-cancellation-mutation';
import { type CancellationFormValues, createCancellationFormSchema } from '../_types/cancellation.types';

export const CancellationForm = () => {
  const t = useTranslations('pages.cancellation.form');
  const showErrorToast = useGenericErrorToast();
  const router = useRouter();

  const form = useForm<CancellationFormValues>({
    resolver: zodResolver(createCancellationFormSchema(t)),
    defaultValues: {
      email: '',
    },
  });

  const { mutate, isPending } = useCancellationMutation({
    onSuccess: () => {
      form.reset();
      toast({
        title: t('success_title'),
        description: t('success_description'),
        variant: 'success',
      });
      router.refresh();
    },
    onError: (error) => {
      switch (error?.status) {
        case 404:
          toast({
            title: t('error_not_found_title'),
            description: t('error_not_found_description'),
            variant: 'destructive',
          });
          break;

        case 400:
          toast({
            description: t('error_not_subscribed_title'),
            variant: 'destructive',
          });
          break;

        default:
          showErrorToast();
          break;
      }
    },
  });

  const onSubmit = (data: CancellationFormValues) => {
    mutate(data);
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Switch } from '@/components/ui/switch';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { toast } from '@/hooks/use-toast';
import { hasApiError } from '@/libs/api-client';
import type { ApiError } from '@/libs/api-error';
import { useRouter } from '@/libs/i18n-routing';

import { LogoutButton } from '../../_components/logout-button';
import { useMyAccountMutation } from '../_hooks/api/use-my-account-mutation';
import { createMyAccountFormSchema, type MyAccountFormValues } from '../_types/my-account.types';
import type { User } from '../_types/user.types';
import { DeleteAccount } from './delete-account';

function getFormValues(user: User) {
  return {
    name: user.name,
    email: user.email,
    notify_status_changes: user.notify_status_changes,
    notify_user_located: user.notify_user_located,
    current_password: '',
    password: '',
    confirm_password: '',
  };
}

export const MyAccountForm = ({ user }: { user: User }) => {
  const t = useTranslations('pages.settings.my_account');
  const showErrorToast = useGenericErrorToast();
  const router = useRouter();
  const form = useForm<MyAccountFormValues>({
    resolver: zodResolver(createMyAccountFormSchema(t)),
    defaultValues: getFormValues(user),
  });

  useEffect(() => {
    form.reset(getFormValues(user));
  }, [user, form]);

  const { handleSubmit, control } = form;

  const { mutate, isPending } = useMyAccountMutation({
    onSuccess: () => {
      toast({
        description: t('success_title'),
        variant: 'success',
      });
      form.reset({
        ...form.getValues(),
        current_password: '',
        password: '',
        confirm_password: '',
      });
      router.refresh();
    },
    onError: (error: ApiError) => {
      if (hasApiError(error, 'current_password', 'invalid')) {
        form.setError('current_password', { message: t('errors.current_password_invalid') });
      } else if (hasApiError(error, 'email', 'taken')) {
        form.setError('email', {
          type: 'server',
          message: t('errors.email_taken'),
        });
      } else {
        showErrorToast();
      }
    },
  });

  const onSubmit = (data: MyAccountFormValues) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} id="my-account-form">
        <div className="space-y-6">
          <h2 className="h4 font-bold">{t('profile.title')}</h2>
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.name')}</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.email')}</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <hr className="border-stroke-weak" />
        </div>

        <div className="my-4 space-y-6">
          <h2 className="h4 font-bold">{t('notifications.title')}</h2>
          <FormField
            control={control}
            name="notify_status_changes"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm">{t('notifications.notify_status_changes')}</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="notify_user_located"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="m-0 text-sm">{t('notifications.notify_user_located')}</FormLabel>
              </FormItem>
            )}
          />
          <hr className="border-stroke-weak" />
        </div>

        <div className="mb-4 space-y-6">
          <h2 className="h4 font-bold">{t('change_password.title')}</h2>
          <FormField
            control={control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('change_password.current_password')}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('change_password.new_password')}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('change_password.confirm_password')}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <hr className="border-stroke-weak" />
        </div>

        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={isPending}>
            {t('submit_cta')}
          </Button>
          <LogoutButton />
          <hr className="w-full border-t border-border lg:hidden" />
          <DeleteAccount className="w-full lg:w-auto" disabled={isPending} />
        </div>
      </form>
    </Form>
  );
};

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ForgotPasswordForm } from '@/app/[locale]/login/components/forgot-password-form';
import { SocialSignIn } from '@/components/forms/social-sign-in';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';

import { Separator } from '../../sign-up/components/separator';
import { useLoginMutation } from '../hooks/api/use-login-mutation';
import { createLoginSchema, type LoginFormValues } from '../types/login.types';

export const LoginForm = ({ error }: { error: boolean }) => {
  const t = useTranslations('components.forms.sign_in');
  const router = useRouter();

  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: logIn, isPending } = useLoginMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      router.push(ROUTES.CHECKOUT);
    },
    onError: () => {
      form.setError('password', {
        type: 'server',
        message: t('errors.invalid_credentials'),
      });
    },
  });

  const handleSubmit = (data: LoginFormValues) => {
    logIn(data);
  };

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <h1 className="text-center h3 font-bold text-strong">{t('title')}</h1>

        {error && (
          <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {t('errors.account_not_found')}
          </div>
        )}

        <SocialSignIn redirectTo={ROUTES.CHECKOUT} />

        <Separator>{t('or')}</Separator>
        <form id="sign-in-form" onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-normal text-weak">{t('email_label')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('email_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-normal text-weak">{t('password_label')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder={t('password_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ForgotPasswordForm className="self-start" onOpen={() => form.clearErrors()} />

          <Button
            form="sign-in-form"
            type="submit"
            className="h-auto w-full px-6 py-4 text-lg leading-5"
            disabled={isPending || isSubmitted}
          >
            {t('submit_button')}
          </Button>
        </form>
      </Form>
    </div>
  );
};

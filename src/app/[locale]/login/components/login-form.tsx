'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Route } from 'next';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { ForgotPasswordForm } from '@/app/[locale]/login/components/forgot-password-form';
import { SocialSignIn } from '@/components/forms/social-sign-in';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { REDIRECT_QUERY_PARAM, ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';
import { resolveRedirectTarget, stripLocalePrefix } from '@/libs/redirect-target';
import { actionSignIn } from '@/server/actions/auth.actions';

import { Separator } from '../../sign-up/components/separator';
import { createLoginSchema, type LoginFormValues } from '../types/login.types';

export const LoginForm = ({ error }: { error: boolean }) => {
  const t = useTranslations('components.forms.sign_in');
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
   * Where the guards said this visitor was headed, once it has been checked
   * to be a path on this site rather than somewhere else.
   */
  // TODO: [refactor] routes checkout wat in previous version was used
  const nextRoute = ROUTES.MEMBER.CONTACT_US || ROUTES.CHECKOUT;
  const destination = stripLocalePrefix(
    resolveRedirectTarget(searchParams.get(REDIRECT_QUERY_PARAM), nextRoute),
  ) as Route;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /*
   * Every failure renders the same message on the password field, whatever the
   * API's error code says. Telling a missing account apart from a wrong password
   * would change what the visitor reads and turn this form into a way of finding
   * out which addresses have accounts.
   */
  const { execute: logIn, isPending } = useAction(actionSignIn, {
    onSuccess: () => {
      router.push(destination);
      router.refresh();
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

        <SocialSignIn />

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
            disabled={isPending}
          >
            {t('submit_button')}
          </Button>
        </form>
      </Form>
    </div>
  );
};

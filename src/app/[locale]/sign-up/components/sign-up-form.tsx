'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { SocialSignIn } from '@/components/forms/social-sign-in';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { useRouter } from '@/libs/i18n-routing';
import { isEmailTakenActionError } from '@/server/lib/auth-action-error';
import { actionRegister } from '@/server/actions/auth.actions';
import { createSignUpSchema, type SignUpFormValues } from '@/types/sign-up.types';

import { Separator } from './separator';

export const SignUpForm = () => {
  const t = useTranslations('pages.sign_up.components.sign_up_form');
  const showErrorToast = useGenericErrorToast();
  const router = useRouter();
  const locale = useLocale();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: {
      email: '',
    },
  });

  const { execute: signUp, isPending } = useAction(actionRegister, {
    onSuccess: () => {
      router.push(ROUTES.CHECKOUT);
      router.refresh();
      setIsRedirecting(true);
      setIsSubmitting(false);
    },
    onError: ({ error }) => {
      if (isEmailTakenActionError(error.serverError)) {
        form.setError('email', {
          type: 'server',
          message: t('errors.email_exists'),
        });
      } else {
        showErrorToast();
      }
      setIsSubmitting(false);
    },
  });

  const handleSubmit = ({ email }: SignUpFormValues) => {
    setIsSubmitting(true);
    signUp({ email, locale });
  };

  return (
    <>
      <div className="grid w-full gap-5">
        <SocialSignIn />
      </div>
      <Separator>{t('or')}</Separator>
      <div className="flex w-full flex-col gap-5 text-left">
        <Form {...form}>
          <form id="sign-up-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-normal text-strong">{t('email_label')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('email_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
          <Button
            form="sign-up-form"
            size="lg"
            type="submit"
            disabled={isPending || isRedirecting}
            className="inline-block h-auto min-h-12 py-2 whitespace-normal"
          >
            {t('continue_with_email')}
            {isSubmitting ? <Icon name="reload" className="ms-2 animate-spin" /> : ''}
          </Button>
        </Form>
      </div>
    </>
  );
};

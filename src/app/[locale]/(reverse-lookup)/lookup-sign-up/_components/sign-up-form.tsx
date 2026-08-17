'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import AvatarWithLock from '@/components/reverse-lookup/avatar-with-lock';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useGenericErrorToast } from '@/hooks/use-generic-error-toast';
import { cn } from '@/libs/utils';
import { actionRegister } from '@/server/actions/auth.actions';
import { isEmailTakenActionError } from '@/server/lib/auth-action-error';
import { createSignUpSchema, type SignUpFormValues } from '@/types/sign-up.types';

export const SignUpForm = ({ phoneNumber, className }: { phoneNumber: string; className?: string }) => {
  const t = useTranslations('pages.reverse_lookup.sign_up');
  const router = useRouter();
  const showErrorToast = useGenericErrorToast();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: {
      email: '',
    },
  });

  const { execute: signUp, isPending } = useAction(actionRegister, {
    onSuccess: () => {
      router.push(ROUTES.REVERSE_LOOKUP.SUMMARY);
      router.refresh();
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
    },
  });

  const handleSubmit = (data: SignUpFormValues) => signUp(data);

  return (
    <main className={cn('s-main overflow-hidden py-10', className)}>
      <section className="container-content lg:px-10">
        <h3 className="w-full text-center font-bold">{t('title')}</h3>
        <div className="mx-4 mt-8 rounded-2xl border border-green-200 p-5 text-start">
          <div className="flex items-center gap-5">
            <AvatarWithLock animate={false} />
            <div className="flex w-full flex-col">
              <h3 className="mt-2 font-bold">{phoneNumber}</h3>
              <p className="mt-2 text-sm text-weak">{t('latest_report')}</p>
            </div>
          </div>
          <div
            className={`
              mt-8 rounded-lg border-y border-r border-l-4 border-amber-200 border-l-amber-800
              bg-[rgba(255,192,46,0.05)] p-5
            `}
          >
            <div className="flex items-start gap-3">
              <Icon name="alert-circle" className="text-amber-800" />
              <div className="flex flex-col">
                <p className="font-bold">{t('card_title')}</p>
                <p className="mt-2 text-sm text-weak">{t('card_description')}</p>
              </div>
            </div>
          </div>
        </div>
        <h5 className="m-6 text-center font-bold lg:mx-0">{t('form_title')}</h5>
        <Form {...form}>
          <form id="sign-up-form" onSubmit={form.handleSubmit(handleSubmit)} className="mx-4 flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-normal text-weak">{t('email_title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('email_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              form="sign-up-form"
              type="submit"
              disabled={isPending}
              className="h-auto w-full px-6 py-4 text-lg leading-5"
            >
              {t('submit_button')}
              {isPending ? <Icon name="reload" className="ms-2 animate-spin" /> : ''}
            </Button>
          </form>
        </Form>
      </section>
    </main>
  );
};

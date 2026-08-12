import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
  type SubmitFn,
} from '../types/reset-password-form.types';

export const ForgotPasswordFormContent = ({
  isPending,
  onCancel,
  onSubmit,
  serverError,
}: {
  isPending: boolean;
  onCancel: () => void;
  onSubmit: SubmitFn;
  serverError?: string;
}) => {
  const t = useTranslations('components.forms.forgot_password');
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: {
      email: '',
    },
  });

  const { handleSubmit, control } = form;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-bold">{t('title')}</DialogTitle>
      </DialogHeader>
      <DialogDescription>{t('subtitle')}</DialogDescription>
      <Form {...form}>
        <form
          onSubmit={((e) => {
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          })}
          className="space-y-4"
          id="forgot-password-form"
        >
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder={t('email_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
        {serverError && (
          <FormMessage className="mt-2">
            {serverError}
          </FormMessage>
        )}
        <DialogFooter className="mt-6">
          <Button type="submit" form="forgot-password-form" disabled={isPending}>{t('submit_button')}</Button>
          <Button variant="ghost" onClick={onCancel}>{t('cancel_button')}</Button>
        </DialogFooter>
      </Form>
    </>
  );
};

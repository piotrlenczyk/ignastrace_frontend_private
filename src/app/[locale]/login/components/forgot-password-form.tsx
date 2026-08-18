'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Dialog, DialogContent, DialogPortal, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/libs/utils';
import { useForgotPasswordMutation } from '@/network/api/hooks/use-forgot-password-mutation';

import type { ForgotPasswordFormValues } from '../types/reset-password-form.types';
import { ForgotPasswordEndContent } from './forgot-password-end-content';
import { ForgotPasswordFormContent } from './forgot-password-form-content';

export const ForgotPasswordForm = ({ className, onOpen }: { className?: string; onOpen?: () => void }) => {
  const t = useTranslations('components.forms.forgot_password');
  const commonT = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const { mutate, isPending } = useForgotPasswordMutation();

  const toggle = () => {
    setServerError('');
    setIsOpen(!isOpen);
    setIsSubmitted(false);
    setSubmittedEmail('');
  };

  /*
   * The address shown on the confirmation comes from what was typed, not from the
   * response: the API answers with a status and nothing else, on purpose. The
   * confirmation is reached for every address it accepts — an address with no
   * account is answered exactly like one that has it — so `onError` is left with
   * the failures that are genuinely this application's to report.
   */
  const handleSubmit = ({ email }: ForgotPasswordFormValues) => {
    setServerError('');

    mutate(
      { body: { email } },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          setSubmittedEmail(email);
        },
        onError: () => {
          setServerError(commonT('errors.server_error_description'));
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogTrigger asChild>
        <button type="button" onClick={onOpen} className={cn('text-sm text-secondary underline', className)}>
          {t('title')}
        </button>
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className="max-w-[480px]">
          {isSubmitted ? (
            <ForgotPasswordEndContent email={submittedEmail} onClose={toggle} />
          ) : (
            <ForgotPasswordFormContent
              isPending={isPending}
              onCancel={toggle}
              onSubmit={handleSubmit}
              serverError={serverError}
            />
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

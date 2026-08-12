'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Dialog, DialogContent, DialogPortal, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/libs/utils';

import { useForgotPasswordMutation } from '../hooks/api/use-forgot-password-mutation';
import type { ForgotPasswordFormValues } from '../types/reset-password-form.types';
import { ForgotPasswordEndContent } from './forgot-password-end-content';
import { ForgotPasswordFormContent } from './forgot-password-form-content';

export const ForgotPasswordForm = ({ className, onOpen }: { className?: string; onOpen?: () => void }) => {
  const t = useTranslations('components.forms.forgot_password');
  const commonT = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const { mutate, isPending } = useForgotPasswordMutation({
    onSuccess: (email) => {
      setIsSubmitted(true);
      setEmail(email);
    },
    onError: () => {
      setServerError(commonT('errors.server_error_description'));
    },
  });

  const toggle = () => {
    setServerError('');
    setIsOpen(!isOpen);
    setIsSubmitted(false);
    setEmail('');
  };

  const handleSubmit = (data: ForgotPasswordFormValues) => {
    setServerError('');
    mutate(data);
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
          {isSubmitted
            ? (
                <ForgotPasswordEndContent email={email} onClose={toggle} />
              )
            : (
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

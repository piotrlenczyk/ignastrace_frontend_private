'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import { actionLogout } from '@/server/actions/auth.actions';

import { useDeleteAccountMutation } from '../_hooks/api/use-delete-account-mutation';

export function DeleteAccount({ className, disabled = false }: { className?: string; disabled?: boolean }) {
  const t = useTranslations('pages.settings.my_account');
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation({
    onSuccess: () => {
      setIsDeleted(true);
      actionLogout();
    },
    onError: () => {
      setIsDeleted(false);
    },
  });

  useEffect(() => {
    if (isDeleted && !isOpen) {
      router.push(ROUTES.HOME);
    }
  }, [isDeleted, isOpen, router]);

  return (
    <>
      <Button
        variant="ghost"
        type="button"
        className={cn('text-red hover:text-red', className)}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        <Icon name="delete" className="text-xl" />
        {t('delete_cta')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="h4 font-bold">{t('delete_dialog.title')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {isDeleted ? (
              <div className="animate-[fade-in_300ms_ease-out_100ms_both]">
                {t.rich('delete_dialog.description_canceled')}
              </div>
            ) : (
              <div>{t.rich('delete_dialog.description')}</div>
            )}
          </DialogDescription>

          <DialogFooter className="mt-6 flex gap-4 text-weak">
            {isDeleted ? (
              <Button onClick={() => setIsOpen(false)}>{t('delete_dialog.close_cta')}</Button>
            ) : (
              <>
                <Button variant="destructive" onClick={() => deleteAccount()} disabled={isPending}>
                  {isPending ? t('delete_dialog.deleting_cta') : t('delete_dialog.delete_cta')}
                </Button>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  {t('delete_dialog.close_cta')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

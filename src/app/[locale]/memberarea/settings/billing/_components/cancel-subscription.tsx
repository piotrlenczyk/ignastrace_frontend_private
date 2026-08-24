import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CancelSubscriptionProps = {
  isPending: boolean;
  onCancel: () => void;
};

/**
 * The dialog only ever confirms a cancellation, never reports one.
 *
 * It used to have a second face — "your subscription has been canceled", off a
 * client-held copy of the subscription that the legacy mutation's response
 * updated. That copy is gone: the screen reads the payments service on the
 * server, and the write still goes to the legacy backend, so nothing this dialog
 * could read would ever say cancelled. The branch is pruned rather than left
 * verbatim, because the screen holding it is itself in scope — see ADR 0022's
 * correction of 0021, and ADR 0024 for what the write being elsewhere costs.
 */
export function CancelSubscription({ isPending, onCancel }: CancelSubscriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.settings.billing.cancel_dialog');

  const handleCancel = () => {
    onCancel();
  };

  return (
    <>
      <button type="button" className="text-left font-bold" onClick={() => setIsOpen(true)}>
        {t('cancel_cta')}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="h4 font-bold">{t('title')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <div dangerouslySetInnerHTML={{ __html: t.raw('description') }} />
          </DialogDescription>

          <DialogFooter className="mt-6 flex gap-4 text-weak">
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              {t('cancel_cta')}
            </Button>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              {t('close_cta')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

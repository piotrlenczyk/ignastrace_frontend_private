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
import type { SubscriptionStatus } from '@/types/subscription';

type CancelSubscriptionProps = {
  status: SubscriptionStatus;
  isPending: boolean;
  onCancel: () => void;
};

export function CancelSubscription({ status, isPending, onCancel }: CancelSubscriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.settings.billing.cancel_dialog');

  const isCanceled = status === 'cancelled' || status === 'expired';

  const handleCancel = () => {
    onCancel();
  };

  return (
    <>
      <button
        type="button"
        className="text-left font-bold"
        onClick={() => setIsOpen(true)}
      >
        {t('cancel_cta')}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="h4 font-bold">{t('title')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {isCanceled
              ? (
            // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
                  <div
                    className="animate-[fade-in_300ms_ease-out_100ms_both]"
                    dangerouslySetInnerHTML={{ __html: t.raw('description_canceled') }}
                  />
                )
              : (
            // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
                  <div
                    dangerouslySetInnerHTML={{ __html: t.raw('description') }}
                  />
                )}
          </DialogDescription>

          <DialogFooter className="mt-6 flex gap-4 text-weak">
            {isCanceled
              ? (
                  <Button onClick={() => setIsOpen(false)}>
                    {t('done_cta')}
                  </Button>
                )
              : (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      {t('cancel_cta')}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>
                      {t('close_cta')}
                    </Button>
                  </>
                )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

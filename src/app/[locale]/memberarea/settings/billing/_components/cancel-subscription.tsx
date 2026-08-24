'use client';

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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from '@/libs/i18n-routing';
import { useCancelSubscriptionMutation } from '@/network/payments-api/hooks/use-cancel-subscription-mutation';

/**
 * The dialog only ever confirms a cancellation, never reports one.
 *
 * It used to have a second face — "your subscription has been canceled", off a
 * client-held copy of the subscription that the legacy mutation's response
 * updated. That copy is gone and is not coming back: the answer here is an
 * acknowledgement, `{ message: string }`, with no subscription in it. What the
 * member sees instead is the refreshed card — badge, cancellation date, the date
 * access runs to, and the offer to call it off — which now tells the truth,
 * because the write and the read are finally the same upstream.
 *
 * The dialog owns the act it confirms rather than being handed a callback: it is
 * the only thing that knows when to close, and closing on success is the whole of
 * what it does with the answer.
 */
export function CancelSubscription() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.settings.billing.cancel_dialog');
  const tNew = useTranslations('__NEW__.settings.billing');
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: cancelSubscription, isPending } = useCancelSubscriptionMutation();

  /*
   * An empty body: the operation declares one as required, and its only field is
   * the member's own reason, which this dialog does not ask for.
   *
   * The refresh is what shows the result — the subscription is read in a server
   * component, so there is no query key to invalidate. A refusal is not typed and
   * cannot be, so the member is told the act failed in this application's words
   * and the service's own body goes to the console.
   */
  const handleCancel = () =>
    cancelSubscription(
      { body: {} },
      {
        onSuccess: () => {
          setIsOpen(false);
          router.refresh();
        },
        onError: (error) => {
          console.error('The payments service refused the cancellation', error);
          toast({ title: tNew('cancel_error'), variant: 'destructive' });
        },
      },
    );

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

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
import { useConsent } from '@/hooks/use-consent';

type ConsentModalProps = {
  onAccept?: () => void;
  onDecline?: () => void;
};

export function ConsentModal({ onAccept, onDecline }: ConsentModalProps) {
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const { setConsentGiven } = useConsent();
  const t = useTranslations('consent');

  const handleAccept = () => {
    setConsentGiven(true);
    onAccept?.();
  };

  const handleDecline = () => {
    setShowDeclineModal(true);
  };

  const handleDeclineAccept = () => {
    setShowDeclineModal(false);
    onDecline?.();
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="mb-0 text-lg font-bold tracking-normal">
            {showDeclineModal ? t('decline_title') : t('title')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 font-normal tracking-normal text-weak">
            {showDeclineModal ? t('decline_description') : t('description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 flex gap-2">
          {showDeclineModal
            ? (
                <Button onClick={handleDeclineAccept} className="w-full">
                  {t('decline_accept')}
                </Button>
              )
            : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDecline}
                    className="flex-1 font-normal"
                    style={{ borderColor: '#FF6E1ACC', color: '#FF6E1ACC' }}
                  >
                    {t('decline')}
                  </Button>
                  <Button onClick={handleAccept} className="flex-1 font-normal">
                    {t('accept')}
                  </Button>
                </>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

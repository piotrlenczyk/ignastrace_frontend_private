'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="font-bold text-h3 leading-h3 tracking-normal mb-0">
            {showDeclineModal ? t('decline_title') : t('title')}
          </DialogTitle>
          <DialogDescription className="font-normal text-sm leading-6 tracking-normal text-weak">
            {showDeclineModal ? t('decline_description') : t('description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-3">
          {showDeclineModal ? (
            <Button onClick={handleDeclineAccept} className="w-full">
              {t('decline_accept')}
            </Button>
          ) : (
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

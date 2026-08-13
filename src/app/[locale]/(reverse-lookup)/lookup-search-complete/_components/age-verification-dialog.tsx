import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { IconAlertTriangle } from '@/components/ui/icon/icons';

export type AgeVerificationDialogProps = {
  isOpen: boolean;
  onClickButton?: () => void;
};

export function AgeVerificationDialog({ isOpen, onClickButton }: AgeVerificationDialogProps) {
  const t = useTranslations('pages.reverse_lookup.search_complete.components.age_verification_dialog');

  return (
    <Dialog open={isOpen}>
      <DialogOverlay className="backdrop-blur-xs" />
      <DialogPortal>
        <DialogContent className="max-w-[500px] p-6 lg:p-8" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="h4 font-bold">{t('title')}</DialogTitle>
          </DialogHeader>
          <p>{t('description')}</p>
          <div className="mt-5 flex items-center gap-2 rounded-md bg-weak p-3 lg:mt-6 lg:p-4">
            <IconAlertTriangle size="large" className="text-primary" />
            <span className="text-sm">
              {t.rich('info_message', {
                bold: (chunks) => <span className="font-bold">{chunks}</span>,
              })}
            </span>
          </div>
          <Button size="md" className="mt-5 w-full lg:mt-6" onClick={onClickButton}>
            {t('button_text')}
          </Button>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

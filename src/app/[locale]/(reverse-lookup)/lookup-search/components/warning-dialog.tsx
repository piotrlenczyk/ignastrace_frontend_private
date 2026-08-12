'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconLock } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';

export function WarningDialog({ isOpen, phoneNumber }: { isOpen: boolean; phoneNumber: string }) {
  const t = useTranslations('pages.reverse_lookup.search.components.warning_dialog');
  const router = useRouter();
  const onNavigateToSearchComplete = () =>
    router.push(ROUTES.REVERSE_LOOKUP.SEARCH_COMPLETE)
  ;

  return (
    <Dialog open={isOpen}>
      <DialogOverlay className="backdrop-blur-sm" />
      <DialogPortal>
        <DialogContent className="max-w-[500px] p-6 lg:p-8" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">{t('title')}</DialogTitle>
          </DialogHeader>
          <h3 className="font-bold">{phoneNumber}</h3>
          <p className="mt-2">{t('description')}</p>
          <div className="mt-4 flex items-center gap-x-2 rounded-md bg-weak p-3 lg:mt-6 lg:p-4">
            <IconLock size="large" className="text-primary" />
            <span className="text-caption text-weak">{t('info_message', { phoneNumber })}</span>
          </div>
          <Button
            size="md"
            className="mt-5 w-full lg:mt-6"
            onClick={onNavigateToSearchComplete}
          >
            {t('button_text')}
          </Button>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

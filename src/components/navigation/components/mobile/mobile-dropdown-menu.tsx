import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';

import { Button } from '@/components/ui/button';
import VisuallyHidden from '@/components/ui/visually-hidden';
import { cn } from '@/libs/utils';

import { MobileMainNavigation } from './mobile-main-navigation';

const TriggerButton = ({ action, ...props }: { action: 'open' | 'close' }) => {
  const t = useTranslations('common');
  const label = action === 'open' ? t('open_menu') : t('close_menu');
  const Icon = action === 'open' ? Menu : X;

  return (
    <Dialog.Trigger asChild>
      <Button variant="tranparent" size="icon" {...props} className="ml-2 size-12">
        <Icon className={cn('size-[24px] shrink-0', action === 'close' ? 'text-primary' : 'text-strong')} />
        <span className="sr-only">{label}</span>
      </Button>
    </Dialog.Trigger>
  );
};

export const MobileDropdownMenu = ({
  toggleLanguageSelectorVisibility,
}: {
  toggleLanguageSelectorVisibility: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
    toggleLanguageSelectorVisibility();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    toggleLanguageSelectorVisibility();
  };

  const t = useTranslations('navigation');

  return (
    <div className="lg:hidden">
      <Dialog.Root open={isOpen} onOpenChange={toggleMenu} modal={false}>
        <TriggerButton action={isOpen ? 'close' : 'open'} />
        <Dialog.Portal>
          <Dialog.Content className="s-mobile-menu-content">
            <VisuallyHidden>
              <Dialog.DialogTitle>{t('mobile_dialog_title')}</Dialog.DialogTitle>
              <Dialog.DialogDescription>{t('mobile_dialog_description')}</Dialog.DialogDescription>
            </VisuallyHidden>
            <div className="s-mobile-menu-content-links">
              <Suspense fallback={<div>Cargando...</div>}>
                <MobileMainNavigation onClick={closeMenu} />
              </Suspense>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const ForgotPasswordEndContent = ({ email, onClose }: { email: string; onClose: () => void }) => {
  const t = useTranslations('components.forms.forgot_password.success');

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-bold">{t('title')}</DialogTitle>
      </DialogHeader>
      <p>
        {t('line_1')}
        <span className="block truncate font-semibold">{email}</span>
        {t('line_2')}
      </p>
      <DialogFooter className="mt-6">
        <Button type="button" onClick={onClose}>
          {t('done')}
        </Button>
      </DialogFooter>
    </>
  );
};

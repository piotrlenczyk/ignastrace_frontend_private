import { useTranslations } from 'next-intl';

import { useToast } from './use-toast';

export function useMessageErrorToast() {
  const { toast } = useToast();
  const t = useTranslations('common');

  const showErrorToast = (message: string, title?: string) => {
    toast({
      title: title || t('errors.server_error'),
      description: message || t('errors.server_error_description'),
      variant: 'destructive',
    });
  };

  return showErrorToast;
}

import { useTranslations } from 'next-intl';

import { useToast } from './use-toast';

export function useGenericErrorToast() {
  const { toast } = useToast();
  const t = useTranslations('common');

  const showErrorToast = () => {
    toast({
      title: t('errors.server_error'),
      description: t('errors.server_error_description'),
      variant: 'destructive',
    });
  };

  return showErrorToast;
}

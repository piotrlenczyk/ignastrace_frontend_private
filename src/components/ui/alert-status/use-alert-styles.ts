import type { ReactNode } from 'react';

import type { AlertVariant, AlertVariantConfig } from './alert-variants';
import { alertVariants } from './alert-variants';

export const useAlertStyles = (variant: AlertVariant, customIcon?: ReactNode): AlertVariantConfig => {
  const config = alertVariants[variant];

  return {
    ...config,
    icon: customIcon || config.icon,
  };
};

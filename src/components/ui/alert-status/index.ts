import { ReactNode } from 'react';
import { alertVariants, AlertVariant, AlertVariantConfig } from './alert-variants';

export const useAlertStyles = (
  variant: AlertVariant, 
  customIcon?: ReactNode
): AlertVariantConfig => {
  const config = alertVariants[variant];

  return {
    ...config,
    icon: customIcon || config.icon
  };
};

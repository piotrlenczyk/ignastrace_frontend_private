import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';

export type AlertVariant = 'success' | 'warning' | 'info';

export type AlertVariantConfig = {
  borderLeftColor: string;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
  icon: ReactNode;
};

export const alertVariants: Record<AlertVariant, AlertVariantConfig> = {
  success: {
    borderLeftColor: 'border-l-green-800',
    borderColor: 'border-l-green-200',
    bgColor: 'bg-green-50',
    iconColor: 'text-green',
    textColor: 'text-green',
    icon: <Icon name="check-circle" />,
  },
  warning: {
    borderLeftColor: 'border-l-red-800',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    iconColor: 'text-error',
    textColor: 'text-error',
    icon: <Icon name="alert-circle" />,
  },
  info: {
    borderLeftColor: 'border-l-blue-600',
    borderColor: 'border-l-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-800',
    icon: <Icon name="info" />,
  },
};

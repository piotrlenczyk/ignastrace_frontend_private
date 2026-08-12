'use client';

import { cn } from '@/libs/utils';
import { ReactNode } from 'react';
import { AlertVariant } from './alert-status/alert-variants';
import { useAlertStyles } from './alert-status/use-alert-styles';

interface AlertStatusProps {
  title: string;
  description: string;
  variant?: AlertVariant;
  className?: string;
  customIcon?: ReactNode;
  showIcon?: boolean;
}

const AlertStatus = ({ 
  title, 
  description, 
  variant = 'success', 
  className,
  customIcon,
  showIcon = true
}: AlertStatusProps) => {
  const styles = useAlertStyles(variant, customIcon);

  return ( 
      <div
        className={cn(
          'rounded-lg border-y border-l-4 border-r border-gray-100 p-4',
          styles.borderColor,
          styles.borderLeftColor,
          styles.bgColor,
          className
        )}
      >
        <div className="flex items-start gap-3">
          {showIcon && (
            <div className={cn(styles.textColor, '[&_svg]:text-current')}> 
              {styles.icon}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className={cn('text-sm font-bold', styles.textColor)}>
              {title}
            </p>
            <p className="text-sm text-weak">
              {description}
            </p>
          </div>
        </div>
      </div>
  );
};

export default AlertStatus;
export type { AlertStatusProps };
export { type AlertVariant } from './alert-status/alert-variants';

import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconCancel = ({ className, ...props }: IconProps) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M19.0004 4.99988L12.0004 11.9999M12.0004 11.9999L5.00043 18.9999M12.0004 11.9999L5.00043 4.99988M12.0004 11.9999L19.0004 18.9999"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

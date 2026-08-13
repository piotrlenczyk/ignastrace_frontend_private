import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconCancelSm = ({ className, ...props }: IconProps) => (
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
      d="M18.0005 5.99988L12.0005 11.9999M12.0005 11.9999L6.00049 17.9999M12.0005 11.9999L6.00049 5.99988M12.0005 11.9999L18.0005 17.9999"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

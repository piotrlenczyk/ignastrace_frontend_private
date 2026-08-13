import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowLeft1 = ({ className, ...props }: IconProps) => (
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
      d="M4.9998 12L19.9998 11.9998M8.9998 6.99991L4.70691 11.2928C4.37358 11.6261 4.20691 11.7928 4.20691 11.9999C4.20691 12.207 4.37358 12.3737 4.70691 12.707L8.9998 16.9999"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

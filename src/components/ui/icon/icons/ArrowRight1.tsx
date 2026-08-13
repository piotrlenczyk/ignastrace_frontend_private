import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowRight1 = ({ className, ...props }: IconProps) => (
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
      d="M19.0001 11.9998H4.00012M14.9999 6.99991L19.2928 11.2928C19.6262 11.6261 19.7928 11.7928 19.7928 11.9999C19.7928 12.207 19.6262 12.3737 19.2928 12.707L14.9999 16.9999"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

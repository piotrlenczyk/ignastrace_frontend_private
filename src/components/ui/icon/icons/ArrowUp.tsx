import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowUp = ({ className, ...props }: IconProps) => (
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
      d="M5.99994 15L11.2928 9.70715C11.6262 9.37382 11.7928 9.20715 11.9999 9.20715C12.207 9.20715 12.3737 9.37382 12.707 9.70715L17.9999 15"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

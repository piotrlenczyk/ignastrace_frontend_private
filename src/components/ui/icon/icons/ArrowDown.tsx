import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowDown = ({ className, ...props }: IconProps) => (
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
      d="M6 9L11.2929 14.2929C11.6262 14.6262 11.7929 14.7929 12 14.7929C12.2071 14.7929 12.3738 14.6262 12.7071 14.2929L18 9"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

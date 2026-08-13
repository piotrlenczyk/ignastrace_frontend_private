import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconRefreshCw = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 16 16"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="Icon">
      <path
        id="Vector"
        d="M9.33333 6.66667H13.1667C13.6267 6.66667 14 6.29333 14 5.83333V2H13V4.68667C11.9033 3.02667 10.04 2 8 2C4.69333 2 2 4.69333 2 8C2 11.3067 4.69333 14 8 14C10.7133 14 13.0967 12.17 13.7967 9.55333L12.83 9.29333C12.2467 11.4733 10.26 13 8 13C5.24333 13 3 10.7567 3 8C3 5.24333 5.24333 3 8 3C9.87 3 11.56 4.03333 12.4233 5.66667H9.33333V6.66667Z"
      />
    </g>
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconTrashLine = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="Style=Line">
      <path
        id="Vector"
        d="M21 5H16V4.75C16 3.235 14.765 2 13.25 2H10.75C9.235 2 8 3.235 8 4.75V5H3V6.5H4V19.25C4 20.765 5.235 22 6.75 22H17.25C18.765 22 20 20.765 20 19.25V6.5H21V5ZM9.5 4.75C9.5 4.06 10.06 3.5 10.75 3.5H13.25C13.94 3.5 14.5 4.06 14.5 4.75V5H9.5V4.75ZM18.5 19.25C18.5 19.94 17.94 20.5 17.25 20.5H6.75C6.06 20.5 5.5 19.94 5.5 19.25V6.5H18.5V19.25Z"
      />
    </g>
  </svg>
);

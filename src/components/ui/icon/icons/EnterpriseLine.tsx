import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconEnterpriseLine = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.5 11V3H6.5V8H3V21H21V11H17.5ZM6.5 19.5H4.5V9.5H6.5V19.5ZM16 19.5H8V4.5H16V19.5ZM19.5 19.5H17.5V12.5H19.5V19.5ZM11 6H9.5V8.5H11V6ZM13 6H14.5V8.5H13V6ZM11 10H9.5V12.5H11V10ZM13 10H14.5V12.5H13V10ZM11 14H9.5V16.5H11V14ZM13 14H14.5V16.5H13V14Z"
    />
  </svg>
);

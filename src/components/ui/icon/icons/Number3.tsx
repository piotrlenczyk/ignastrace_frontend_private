import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconNumber3 = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M17.5 9.75V5.75C17.5 4.235 16.265 3 14.75 3H6.5V4.5H14.75C15.44 4.5 16 5.06 16 5.75V9.75C16 10.44 15.44 11 14.75 11H9V12.5H14.75C15.44 12.5 16 13.06 16 13.75V18.25C16 18.94 15.44 19.5 14.75 19.5H6.5V21H14.75C16.265 21 17.5 19.765 17.5 18.25V13.75C17.5 12.96 17.165 12.25 16.63 11.75C17.165 11.25 17.5 10.54 17.5 9.75Z" />
  </svg>
);

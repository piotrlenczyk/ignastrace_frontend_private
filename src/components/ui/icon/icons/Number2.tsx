import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconNumber2 = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M17.5 21H6.5V13.75C6.5 12.235 7.735 11 9.25 11H14.75C15.44 11 16 10.44 16 9.75V5.75C16 5.06 15.44 4.5 14.75 4.5H6.5V3H14.75C16.265 3 17.5 4.235 17.5 5.75V9.75C17.5 11.265 16.265 12.5 14.75 12.5H9.25C8.56 12.5 8 13.06 8 13.75V19.5H17.5V21Z" />
  </svg>
);

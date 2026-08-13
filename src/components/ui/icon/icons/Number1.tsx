import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconNumber1 = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M12.75 19.5V5.75C12.75 4.235 11.515 3 10 3H6.5V4.5H10C10.69 4.5 11.25 5.06 11.25 5.75V19.5H6.5V21H17.5V19.5H12.75Z" />
  </svg>
);

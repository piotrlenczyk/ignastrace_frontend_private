import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconChartBarDown = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M19.75 12.5H15.5V8.75C15.5 8.06 14.94 7.5 14.25 7.5H10V4.25C10 3.56 9.44 3 8.75 3H4.25C3.56 3 3 3.56 3 4.25V21H21V13.75C21 13.06 20.44 12.5 19.75 12.5ZM4.5 19.5V4.5H8.5V19.5H4.5ZM14 19.5H10V9H14V19.5ZM19.5 19.5H15.5V14H19.5V19.5Z" />
  </svg>
);

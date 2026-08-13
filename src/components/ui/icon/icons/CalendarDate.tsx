import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconCalendarDate = ({
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
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.5 3H18.25C19.765 3 21 4.235 21 5.75V18.25C21 19.765 19.765 21 18.25 21H5.75C4.235 21 3 19.765 3 18.25V5.75C3 4.235 4.235 3 5.75 3H6.5V2H8V3H16V2H17.5V3ZM6.5 4.5H5.75C5.06 4.5 4.5 5.06 4.5 5.75V7.5H19.5V5.75C19.5 5.06 18.94 4.5 18.25 4.5H17.5V6H16V4.5H8V6H6.5V4.5ZM5.75 19.5H18.25C18.94 19.5 19.5 18.94 19.5 18.25V9H4.5V18.25C4.5 18.94 5.06 19.5 5.75 19.5ZM11.25 11H12.75V16H14V17.5H10V16H11.25V13.5H10V12H11.25V11Z"
    />
  </svg>
);

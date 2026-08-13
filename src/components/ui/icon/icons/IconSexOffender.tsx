import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconSexOffender = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M12 10.94L15.22 7.71997L16.28 8.77997L13.06 12L16.28 15.22L15.22 16.28L12 13.06L8.78 16.28L7.72 15.22L10.94 12L7.72 8.77997L8.78 7.71997L12 10.94Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 12C2 6.485 6.485 2 12 2C17.515 2 22 6.485 22 12C22 17.515 17.515 22 12 22C6.485 22 2 17.515 2 12ZM3.5 12C3.5 16.685 7.315 20.5 12 20.5C16.685 20.5 20.5 16.685 20.5 12C20.5 7.315 16.685 3.5 12 3.5C7.315 3.5 3.5 7.315 3.5 12Z"
      fill={color}
    />
  </svg>
);

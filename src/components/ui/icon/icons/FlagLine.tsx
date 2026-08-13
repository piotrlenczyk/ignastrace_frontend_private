import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconFlagLine = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M5.5 22H4V2H9.68C10.415 2 11.105 2.285 11.625 2.805L12.455 3.635C12.69 3.87 13.01 4 13.34 4H20.005V15.5H14.34C13.605 15.5 12.915 15.215 12.395 14.695L11.565 13.865C11.33 13.63 11.01 13.5 10.68 13.5H5.5V22ZM5.5 12H10.68C11.415 12 12.105 12.285 12.625 12.805L13.455 13.635C13.69 13.87 14.01 14 14.34 14H18.505V5.5H13.34C12.605 5.5 11.915 5.215 11.395 4.695L10.565 3.865C10.33 3.63 10.01 3.5 9.68 3.5H5.5V12Z" />
  </svg>
);

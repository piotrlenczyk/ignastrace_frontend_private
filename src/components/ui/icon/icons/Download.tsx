import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconDownload = ({
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
      d="M12.885 16.675C12.64 16.92 12.32 17.04 12 17.04C11.68 17.04 11.36 16.92 11.115 16.675L6.47 12.03L7.53 10.97L11.25 14.69V3H12.75V14.69L16.47 10.97L17.53 12.03L12.885 16.675ZM19.5 18.25V15.5H21V18.25C21 19.765 19.765 21 18.25 21H5.75C4.235 21 3 19.765 3 18.25V15.5H4.5V18.25C4.5 18.94 5.06 19.5 5.75 19.5H18.25C18.94 19.5 19.5 18.94 19.5 18.25Z"
    />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconTimer = ({
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
      d="M20.2839 6.28L18.5139 8.05H18.5189C19.7539 9.525 20.5039 11.425 20.5039 13.5C20.5039 18.185 16.6889 22 12.0039 22C7.31891 22 3.50391 18.185 3.50391 13.5C3.50391 9.07 6.91891 5.42 11.2539 5.04V3.5H9.00391V2H15.0039V3.5H12.7539V5.04C14.5339 5.195 16.1589 5.905 17.4539 6.99L19.2239 5.22L20.2839 6.28ZM4.99891 13.5C4.99891 17.36 8.13891 20.5 11.9989 20.5C15.8589 20.5 18.9989 17.36 18.9989 13.5C18.9989 9.64 15.8589 6.5 11.9989 6.5C8.13891 6.5 4.99891 9.64 4.99891 13.5ZM11.249 8.5H12.749V14.5H11.249V8.5Z"
      fill="#36394D"
      fillOpacity={0.45}
    />
  </svg>
);

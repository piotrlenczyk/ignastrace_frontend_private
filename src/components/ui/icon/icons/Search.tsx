import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconSearch = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M21.78 20.72L16.16 15.1C17.31 13.715 18 11.935 18 10C18 5.59 14.41 2 10 2C5.59 2 2 5.59 2 10C2 14.41 5.59 18 10 18C11.935 18 13.715 17.31 15.1 16.16L20.72 21.78L21.78 20.72ZM10 16.5C6.415 16.5 3.5 13.585 3.5 10C3.5 6.415 6.415 3.5 10 3.5C13.585 3.5 16.5 6.415 16.5 10C16.5 13.585 13.585 16.5 10 16.5Z" />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconAlertTriangle = ({
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
    <path d="M22.2243 19.1298L13.0843 3.13977C12.8643 2.74977 12.4443 2.50977 11.9993 2.50977C11.5543 2.50977 11.1343 2.74977 10.9143 3.13977L1.7743 19.1298C1.5493 19.5198 1.5543 19.9898 1.7743 20.3748C1.9993 20.7648 2.4043 20.9998 2.8543 20.9998H21.1393C21.5893 20.9998 21.9943 20.7648 22.2193 20.3748C22.4443 19.9848 22.4493 19.5198 22.2193 19.1298H22.2243ZM11.2493 8.49977H12.7493V14.4998H11.2493V8.49977ZM11.9993 17.9998C11.4493 17.9998 10.9993 17.5498 10.9993 16.9998C10.9993 16.4498 11.4493 15.9998 11.9993 15.9998C12.5493 15.9998 12.9993 16.4498 12.9993 16.9998C12.9993 17.5498 12.5493 17.9998 11.9993 17.9998Z" />
  </svg>
);

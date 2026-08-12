/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconRefresh = ({
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
    <path d="M10 14V15.5H5.37012C6.65513 17.925 9.20502 19.5 12 19.5C15.0449 19.5 17.7646 17.68 18.9297 14.8701L20.3154 15.4453C18.9154 18.8202 15.655 21 12 21C8.95 21 6.145 19.4446 4.5 16.9746V21H3V15.25C3 14.56 3.56 14 4.25 14H10ZM21 3V8.75C21 9.44 20.44 10 19.75 10H14V8.5H18.6299C17.3499 6.07004 14.805 4.5 12 4.5C8.95509 4.50002 6.23535 6.32001 5.07031 9.12988L3.68555 8.55469C5.08564 5.17996 8.34518 3.00002 12 3C15.06 3 17.86 4.56027 19.5 7.03027V3H21Z" />
  </svg>
);

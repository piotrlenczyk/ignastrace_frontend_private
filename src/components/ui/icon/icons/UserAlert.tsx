/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconUserAlert = ({
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
      d="M5 7.5C5 10.535 7.465 13 10.5 13C13.535 13 16 10.535 16 7.5C16 4.465 13.535 2 10.5 2C7.465 2 5 4.465 5 7.5ZM6.5 7.5C6.5 5.295 8.295 3.5 10.5 3.5C12.705 3.5 14.5 5.295 14.5 7.5C14.5 9.705 12.705 11.5 10.5 11.5C8.295 11.5 6.5 9.705 6.5 7.5ZM16.5698 18.41L17.5848 22.195L19.0348 21.805L18.0198 18.02C17.4648 15.95 15.5748 14.5 13.4298 14.5H7.56984C5.41984 14.5 3.53484 15.945 2.97984 18.02L1.96484 21.805L3.41484 22.195L4.42984 18.41C4.80984 16.99 6.09984 16 7.56984 16H13.4298C14.8998 16 16.1898 16.99 16.5698 18.41ZM20.5 11.5V6.5H19V11.5H20.5ZM20.75 14C20.75 14.5523 20.3023 15 19.75 15C19.1977 15 18.75 14.5523 18.75 14C18.75 13.4477 19.1977 13 19.75 13C20.3023 13 20.75 13.4477 20.75 14Z"
      fill="#00A661"
    />
  </svg>
);

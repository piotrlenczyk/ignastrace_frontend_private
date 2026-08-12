/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconCheckCircleLine = ({
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
    <path d="M12 22C6.485 22 2 17.515 2 12C2 6.485 6.485 2 12 2C17.515 2 22 6.485 22 12C22 17.515 17.515 22 12 22ZM12 3.5C7.315 3.5 3.5 7.315 3.5 12C3.5 16.685 7.315 20.5 12 20.5C16.685 20.5 20.5 16.685 20.5 12C20.5 7.315 16.685 3.5 12 3.5Z" />
    <path d="M10.52 15.485C10.52 15.485 10.495 15.485 10.485 15.485C10.125 15.475 9.785 15.305 9.555 15.025L7.67 12.72L8.83 11.77L10.535 13.85L15.7 8.235L16.805 9.25L11.445 15.075C11.21 15.335 10.875 15.48 10.525 15.48L10.52 15.485Z" />
  </svg>
);

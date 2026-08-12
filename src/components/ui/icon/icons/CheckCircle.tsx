/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconCheckCircle = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 25"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M12 2.5C6.485 2.5 2 6.985 2 12.5C2 18.015 6.485 22.5 12 22.5C17.515 22.5 22 18.015 22 12.5C22 6.985 17.515 2.5 12 2.5ZM11.385 15.675C11.14 15.92 10.82 16.04 10.5 16.04C10.18 16.04 9.86 15.92 9.615 15.675L7.22 13.28L8.28 12.22L10.5 14.44L16.22 8.72L17.28 9.78L11.385 15.675Z" />
  </svg>
);

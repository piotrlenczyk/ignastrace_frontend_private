/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconLocationMy = ({
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
      d="M19.96 11.25H22V12.75H19.96C19.605 16.56 16.565 19.605 12.75 19.96V22H11.25V19.96C7.44 19.605 4.395 16.565 4.04 12.75H2V11.25H4.04C4.395 7.44 7.435 4.395 11.25 4.04V2H12.75V4.04C16.56 4.395 19.605 7.435 19.96 11.25ZM5.5 12C5.5 15.585 8.415 18.5 12 18.5C15.585 18.5 18.5 15.585 18.5 12C18.5 8.415 15.585 5.5 12 5.5C8.415 5.5 5.5 8.415 5.5 12ZM8.75 12C8.75 10.21 10.21 8.75 12 8.75C13.79 8.75 15.25 10.21 15.25 12C15.25 13.79 13.79 15.25 12 15.25C10.21 15.25 8.75 13.79 8.75 12ZM10.25 12C10.25 12.965 11.035 13.75 12 13.75C12.965 13.75 13.75 12.965 13.75 12C13.75 11.035 12.965 10.25 12 10.25C11.035 10.25 10.25 11.035 10.25 12Z"
    />
  </svg>
);

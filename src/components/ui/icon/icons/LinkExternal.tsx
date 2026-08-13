import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconLinkExternal = ({
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
      d="M5.75 4.5C5.05921 4.5 4.5 5.05921 4.5 5.75V18.25C4.5 18.9408 5.05921 19.5 5.75 19.5H18.25C18.9408 19.5 19.5 18.9408 19.5 18.25V12.5H21V18.25C21 19.7692 19.7692 21 18.25 21H5.75C4.23079 21 3 19.7692 3 18.25V5.75C3 4.23079 4.23079 3 5.75 3H11.5V4.5H5.75ZM18.4393 4.5H13.5V3H19.75C20.4392 3 21 3.56079 21 4.25V10.5H19.5V5.56066L11.2803 13.7803L10.2197 12.7197L18.4393 4.5Z"
      fill="#00A661"
    />
  </svg>
);

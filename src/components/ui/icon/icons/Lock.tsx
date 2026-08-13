import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconLock = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 25 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="lock-alt-02">
      <path
        id="Vector"
        d="M18.75 10.605V8C18.75 4.69 16.06 2 12.75 2C9.44 2 6.75 4.69 6.75 8V10.605C5.6 10.935 4.75 11.99 4.75 13.25V19.25C4.75 20.765 5.985 22 7.5 22H18C19.515 22 20.75 20.765 20.75 19.25V13.25C20.75 11.995 19.9 10.935 18.75 10.605ZM13.5 16.79V18.5H12V16.79C11.555 16.53 11.25 16.05 11.25 15.5C11.25 14.67 11.92 14 12.75 14C13.58 14 14.25 14.67 14.25 15.5C14.25 16.055 13.945 16.53 13.5 16.79ZM17.25 10.5H8.25V8C8.25 5.52 10.27 3.5 12.75 3.5C15.23 3.5 17.25 5.52 17.25 8V10.5Z"
      />
    </g>
  </svg>
);

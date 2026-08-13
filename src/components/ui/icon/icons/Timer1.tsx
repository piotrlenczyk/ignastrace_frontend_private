import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconTimer1 = ({ className, ...props }: IconProps) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M5 4.81998C3.14864 6.639 2 9.17383 2 11.9776C2 17.5129 6.47715 22.0001 12 22.0001C17.5228 22.0001 22 17.5129 22 11.9776C22 7.12418 18.5581 3.07654 13.9872 2.15286C13.1512 1.98392 12.7332 1.89945 12.3666 2.2002C12 2.50095 12 2.98712 12 3.95947V4.96173M11.0809 13.152L8 6.99998L13.4196 11.2796C14.1901 11.888 14.1941 13.0472 13.4277 13.6607C12.6614 14.2743 11.5189 14.0266 11.0809 13.152Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconTagLine = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
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
      d="M11.865 21.425C12.11 21.67 12.43 21.79 12.75 21.79L12.745 21.795C13.065 21.795 13.385 21.675 13.63 21.43L21.425 13.635C21.91 13.145 21.91 12.35 21.425 11.865L11.56 2H4.75C3.235 2 2 3.235 2 4.75V11.56L11.865 21.425ZM12.75 20.19L3.5 10.94V4.75C3.5 4.06 4.06 3.5 4.75 3.5H10.94L20.19 12.75L12.75 20.19ZM7.5 6.25C7.5 6.94036 6.94036 7.5 6.25 7.5C5.55964 7.5 5 6.94036 5 6.25C5 5.55964 5.55964 5 6.25 5C6.94036 5 7.5 5.55964 7.5 6.25Z"
      fill="#00A661"
    />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconArrowUp = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
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
      d="M19.0288 9.46969L12.8838 3.32469C12.3988 2.83969 11.6038 2.83969 11.1137 3.32469L4.96875 9.46969L6.02875 10.5297L11.2488 5.30969V20.9997H12.7488V5.30969L17.9688 10.5297L19.0288 9.46969Z"
      fill="#00A661"
    />
  </svg>
);

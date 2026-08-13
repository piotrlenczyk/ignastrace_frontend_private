import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowLeft = ({ className, ...props }: IconProps) => (
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
      d="M15 6L9.70709 11.2929C9.37376 11.6262 9.20709 11.7929 9.20709 12C9.20709 12.2071 9.37376 12.3738 9.70709 12.7071L15 18"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

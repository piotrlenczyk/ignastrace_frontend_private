import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconHourglass = ({ className, ...props }: IconProps) => (
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
      d="M4 3H20M5.5 3V5.03039C5.5 6.27227 6.07682 7.4437 7.06116 8.20089L12 12M12 12L16.9388 8.20089C17.9232 7.44371 18.5 6.27227 18.5 5.03039V3M12 12L7.06116 15.7991C6.07682 16.5563 5.5 17.7277 5.5 18.9696V21M12 12L16.9388 15.7991C17.9232 16.5563 18.5 17.7277 18.5 18.9696V21M4 21H20"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowDown1 = ({ className, ...props }: IconProps) => (
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
      d="M12 18.9999V3.99991M6.99988 15L11.2928 19.2929C11.6261 19.6262 11.7928 19.7929 11.9999 19.7929C12.207 19.7929 12.3737 19.6262 12.707 19.2929L16.9999 15"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconArrowUp1 = ({ className, ...props }: IconProps) => (
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
      d="M12 4.99999L12 20M7 8.99999L11.2929 4.70709C11.6262 4.37376 11.7929 4.20709 12 4.20709C12.2071 4.20709 12.3738 4.37376 12.7071 4.70709L17 8.99999"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

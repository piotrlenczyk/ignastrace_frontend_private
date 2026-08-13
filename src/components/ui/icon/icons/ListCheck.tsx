import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconListCheck = ({ className, ...props }: IconProps) => (
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
      d="M10.9961 6H20.9961M10.9961 12H20.9961M10.9961 18H20.9961M2.99609 7.39286C2.99609 7.39286 3.99609 8.04466 4.49609 9C4.49609 9 5.99609 5.25 7.99609 4M2.99609 18.3929C2.99609 18.3929 3.99609 19.0447 4.49609 20C4.49609 20 5.99609 16.25 7.99609 15"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps } from '../iconDefinition';
export const IconLocate = ({ className, ...props }: IconProps) => (
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
      d="M18.9961 12C18.9961 15.866 15.8621 19 11.9961 19M18.9961 12C18.9961 8.13401 15.8621 5 11.9961 5C8.13011 5 4.9961 8.13401 4.9961 12M18.9961 12H21.9961M11.9961 19C8.13011 19 4.9961 15.866 4.9961 12M11.9961 19V22M4.9961 12H1.99609M12 2V5M14.9961 12C14.9961 13.6569 13.653 15 11.9961 15C10.3392 15 8.9961 13.6569 8.9961 12C8.9961 10.3431 10.3392 9 11.9961 9C13.653 9 14.9961 10.3431 14.9961 12Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </svg>
);

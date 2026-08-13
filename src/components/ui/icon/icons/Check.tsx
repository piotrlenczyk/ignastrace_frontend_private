import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconCheck = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path d="M8.74997 18.2898C8.42997 18.2898 8.10997 18.1698 7.86497 17.9248L3.21997 13.2748L4.27997 12.2148L8.74997 16.6848L19.72 5.71484L20.78 6.77484L9.63497 17.9198C9.38997 18.1648 9.06997 18.2848 8.74997 18.2848V18.2898Z" />
  </svg>
);

import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconSendLine = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g id="send">
      <path
        id="Vector"
        d="M21.04 2.96C20.69 2.61 20.185 2.5 19.725 2.67L2.82504 8.895C2.35504 9.065 2.03504 9.5 2.01004 10C1.98004 10.5 2.25504 10.965 2.70004 11.185L9.44504 14.555L12.815 21.3C13.03 21.725 13.46 21.99 13.935 21.99C13.96 21.99 13.98 21.99 14.005 21.99C14.505 21.965 14.935 21.64 15.11 21.175L21.33 4.275C21.5 3.81 21.39 3.31 21.04 2.96ZM13.895 20.115L10.91 14.15L14.53 10.53L13.47 9.47L9.85004 13.09L3.88504 10.105L19.735 4.265L13.895 20.115Z"
      />
    </g>
  </svg>
);

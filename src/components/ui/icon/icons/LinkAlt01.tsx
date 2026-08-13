import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconLinkAlt01 = ({ className, color = 'currentColor', size = 'fontSize', ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 24 24"
    fill={color}
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.895 13.53L16.835 12.47L18.405 10.9C19.115 10.19 19.505 9.25 19.505 8.25C19.505 7.25 19.115 6.305 18.405 5.6C17.695 4.895 16.755 4.5 15.755 4.5C14.755 4.5 13.81 4.89 13.105 5.6L11.535 7.17L10.475 6.11L12.045 4.54C13.035 3.55 14.355 3 15.755 3C17.155 3 18.475 3.545 19.465 4.54C20.455 5.53 21.005 6.85 21.005 8.25C21.005 9.65 20.46 10.97 19.465 11.96L17.895 13.53ZM15.2179 7.72202L7.71902 15.2209L8.77969 16.2815L16.2786 8.78268L15.2179 7.72202ZM4.54 19.46C5.53 20.455 6.85 21 8.25 21C9.65 21 10.97 20.45 11.96 19.46L13.53 17.89L12.47 16.83L10.9 18.4C10.195 19.11 9.25 19.5 8.25 19.5C7.25 19.5 6.31 19.105 5.6 18.4C4.89 17.695 4.5 16.75 4.5 15.75C4.5 14.75 4.89 13.81 5.6 13.1L7.17 11.53L6.11 10.47L4.54 12.04C3.545 13.03 3 14.35 3 15.75C3 17.15 3.55 18.47 4.54 19.46Z"
    />
  </svg>
);

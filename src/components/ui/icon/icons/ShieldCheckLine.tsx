import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconShieldCheckLine = ({
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
    <g id="shield-check">
      <path
        id="Vector"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.375 19.115L12 22.365V22.37L17.625 19.12C19.705 17.92 21 15.68 21 13.275V5.09998C21 4.53498 20.62 4.03498 20.075 3.88998L12 1.72498L3.925 3.88498C3.38 4.03498 3 4.52998 3 5.09498V13.27C3 15.675 4.295 17.915 6.375 19.115ZM4.5 13.27V5.28498L12 3.27498L19.5 5.28498V13.27C19.5 15.14 18.495 16.88 16.875 17.815L12 20.63L7.125 17.815C5.505 16.88 4.5 15.14 4.5 13.27ZM9.8657 13.925C10.1107 14.17 10.4307 14.29 10.7507 14.29C11.0707 14.29 11.3907 14.17 11.6357 13.925L16.7807 8.77997L15.7207 7.71997L10.7507 12.69L8.7807 10.72L7.7207 11.78L9.8657 13.925Z"
      />
    </g>
  </svg>
);

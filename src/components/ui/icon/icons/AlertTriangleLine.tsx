import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconAlertTriangleLine = ({
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
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.86001 20.9998C2.41001 20.9998 2.00501 20.7648 1.78001 20.3748C1.55501 19.9848 1.55001 19.5198 1.78001 19.1248L10.915 3.13977C11.135 2.74977 11.555 2.50977 12 2.50977C12.445 2.50977 12.865 2.74977 13.085 3.13977L22.225 19.1298C22.45 19.5198 22.445 19.9898 22.225 20.3798C22 20.7698 21.595 21.0048 21.145 21.0048L21.14 20.9998H2.86001ZM3.29501 19.4998H20.71L12 4.25977L3.29001 19.4998H3.29501ZM12.75 14.4998V8.99976H11.25V14.4998H12.75ZM13 16.9998C13 17.552 12.5523 17.9998 12 17.9998C11.4477 17.9998 11 17.552 11 16.9998C11 16.4475 11.4477 15.9998 12 15.9998C12.5523 15.9998 13 16.4475 13 16.9998Z"
      fill="currentColor"
    />
  </svg>
);

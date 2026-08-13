import { cn } from '@/libs/utils';

import { type IconProps, sizes } from '../iconDefinition';

export const IconShieldLockLine = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 63 72"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <path
      d="M57 18.2529L31.5 6.59668L6 18.2529V27.0469C6.00003 44.2455 16.264 59.4575 31.5 65.5967C46.736 59.4575 57 44.2455 57 27.0469V18.2529ZM62.9912 28.001C62.6025 48.0055 50.0169 65.6514 31.5 72L30.623 71.6895C12.5868 65.0909 0.391318 47.6881 0.00878906 28.001L0 27.0469V14.4004L31.5 0L63 14.4004V27.0469L62.9912 28.001Z"
      fill="#00A661"
    />
    <path
      d="M31.1426 23C35.0874 23 38.285 26.1978 38.2852 30.1426C38.2852 32.7952 36.8381 35.1079 34.6914 36.3398L38.2852 48H24L27.5928 36.3398C25.4465 35.1077 24 32.7949 24 30.1426C24.0002 26.1978 27.1978 23 31.1426 23Z"
      fill="#00A661"
    />
  </svg>
);

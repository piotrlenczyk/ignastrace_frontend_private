/* eslint-disable simple-import-sort/imports  */
/* eslint-disable import/newline-after-import  */
import { cn } from '@/libs/utils';
import { type IconProps, sizes } from '../iconDefinition';
export const IconFox = ({
  className,
  color = 'currentColor',
  size = 'fontSize',
  ...props
}: IconProps) => (
  <svg
    width={sizes[size]}
    height={sizes[size]}
    viewBox="0 0 71 30"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    {...props}
  >
    <g clipPath="url(#clip0_11733_16160)">
      <path
        d="M9.03024 8.19788V12.0974H17.2724V20.2511H9.03024V29.911H0.566406V0H18.5574L19.1336 8.19788H9.03024Z"
        fill="#36394D"
        fillOpacity={0.45}
      />
      <path
        d="M43.2959 4.5981C46.1038 7.46423 47.5086 10.9241 47.5086 14.977C47.5086 19.0592 46.1037 22.5332 43.2959 25.3997C40.4876 28.2657 37.1005 29.6987 33.1344 29.6987C29.1392 29.6987 25.7369 28.2657 22.9292 25.3997C20.1207 22.5333 18.7168 19.0592 18.7168 14.977C18.7168 10.924 20.1207 7.46423 22.9292 4.5981C25.7369 1.73196 29.1392 0.298828 33.1344 0.298828C37.1003 0.298828 40.4876 1.73196 43.2959 4.5981ZM30.7024 20.9698C30.7024 21.6363 30.9481 22.215 31.4407 22.707C31.9325 23.1995 32.5264 23.4453 33.2211 23.4453C33.916 23.4453 34.5022 23.1995 34.9799 22.707C35.4578 22.215 35.6966 21.6363 35.6966 20.9698V8.85386C35.6966 8.15911 35.4578 7.56599 34.9799 7.07341C34.5024 6.58157 33.9161 6.33516 33.2211 6.33516C32.5264 6.33516 31.9327 6.58157 31.4407 7.07341C30.948 7.56599 30.7024 8.15911 30.7024 8.85386V20.9698Z"
        fill="#36394D"
        fillOpacity={0.45}
      />
      <path
        d="M60.7138 30L56.46 22.4223L52.3389 30H43.0332L51.8958 14.4903L43.5206 0H53.0923L56.5931 6.46967L60.138 0H69.3992L61.2013 14.4016L70.2412 29.9999H60.7138V30Z"
        fill="#36394D"
        fillOpacity={0.45}
      />
    </g>
    <defs>
      <clipPath id="clip0_11733_16160">
        <rect
          width={69.6752}
          height={30}
          fill="white"
          transform="translate(0.566406)"
        />
      </clipPath>
    </defs>
  </svg>
);

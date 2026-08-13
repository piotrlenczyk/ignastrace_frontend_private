import type { MouseEventHandler, SVGProps } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/libs/utils';

import { IconLoaderCircle } from './ui/icon/icons';

const ApplePayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={53} height={22} viewBox="0 0 53 22" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M10.535 2.837c.605-.764 1.015-1.79.907-2.837-.885.044-1.964.59-2.59 1.354-.56.655-1.057 1.723-.928 2.727.993.087 1.985-.502 2.611-1.244m.895 1.44c-1.441-.087-2.668.827-3.357.827S6.33 4.32 5.19 4.342c-1.485.022-2.863.87-3.616 2.219-1.55 2.698-.409 6.701 1.098 8.899.732 1.087 1.614 2.284 2.776 2.241 1.098-.043 1.529-.718 2.863-.718s1.722.718 2.884.697c1.205-.022 1.959-1.088 2.69-2.177.84-1.24 1.184-2.436 1.205-2.502-.021-.021-2.324-.914-2.345-3.59-.022-2.24 1.808-3.307 1.894-3.373-1.033-1.543-2.648-1.717-3.207-1.761M23.99 1.244c3.134 0 5.317 2.183 5.317 5.362 0 3.19-2.228 5.384-5.396 5.384h-3.47v5.576h-2.508V1.244zm-3.55 8.62h2.877c2.184 0 3.426-1.188 3.426-3.247 0-2.058-1.242-3.235-3.414-3.235H20.44zm9.522 4.32c0-2.081 1.579-3.36 4.378-3.517l3.224-.193v-.916c0-1.323-.885-2.115-2.362-2.115-1.4 0-2.273.678-2.486 1.742h-2.284c.135-2.15 1.948-3.733 4.86-3.733 2.854 0 4.679 1.527 4.679 3.914v8.2h-2.318V15.61h-.056c-.682 1.324-2.172 2.16-3.716 2.16-2.307 0-3.92-1.447-3.92-3.585m7.602-1.074v-.939l-2.9.18c-1.444.103-2.261.747-2.261 1.765 0 1.04.85 1.72 2.15 1.72 1.69 0 3.01-1.177 3.01-2.726m4.595 8.833v-1.98c.179.045.581.045.783.045 1.12 0 1.724-.475 2.093-1.696 0-.023.213-.724.213-.736l-4.254-11.91h2.62l2.978 9.682h.045l2.978-9.682h2.552l-4.411 12.521C46.747 21.073 45.582 22 43.142 22c-.202 0-.807-.023-.985-.056"
      fill="#fff"
    />
  </svg>
);

const GooglePayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={45} height={18} viewBox="0 0 45 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M21.004 8.754v5.307h-1.652V.956h4.38q1.667 0 2.83 1.132 1.187 1.131 1.187 2.763c0 1.114-.395 2.035-1.187 2.78-.766.746-1.712 1.114-2.83 1.114h-2.728zm0-6.184v4.57h2.761c.654 0 1.205-.228 1.635-.675a2.23 2.23 0 0 0 .663-1.605c0-.606-.224-1.14-.663-1.588-.43-.465-.972-.693-1.634-.693h-2.762zm11.065 2.228q1.833 0 2.89 1 1.06 1 1.06 2.737v5.526h-1.575v-1.245h-.07q-1.02 1.537-2.727 1.535c-.972 0-1.78-.29-2.435-.877-.654-.588-.98-1.316-.98-2.193q0-1.395 1.032-2.211c.688-.553 1.609-.824 2.753-.824.981 0 1.79.184 2.418.552v-.386c0-.588-.224-1.079-.68-1.491a2.3 2.3 0 0 0-1.6-.614c-.92 0-1.652.395-2.186 1.193l-1.454-.93c.8-1.184 1.988-1.772 3.554-1.772m-2.134 6.509c0 .438.18.807.55 1.096.362.29.792.439 1.283.439q1.045 0 1.858-.79.816-.787.818-1.85c-.517-.413-1.23-.623-2.151-.623-.671 0-1.23.166-1.678.49-.456.343-.68.755-.68 1.238M45 5.088 39.493 18h-1.704l2.048-4.518-3.63-8.394h1.797l2.616 6.438h.035L43.2 5.088z"
      fill="#FFFFFF"
    />
    <path
      d="M14.293 6.104H7.368V9h3.988a3.5 3.5 0 0 1-1.48 2.332h.001l-.072 1.73 2.446.147c1.385-1.307 2.18-3.24 2.18-5.525 0-.549-.049-1.074-.138-1.58"
      fill="#0085F7"
    />
    <path
      d="M9.877 11.331c-.661.454-1.512.72-2.507.72-1.923 0-3.554-1.321-4.138-3.102L1.19 8.622l-.407 2.266c1.214 2.454 3.707 4.138 6.587 4.138 1.99 0 3.663-.667 4.88-1.816h.002z"
      fill="#00A94B"
    />
    <path
      d="M3.002 7.513c0-.5.082-.983.23-1.438l-.637-1.937H.784A7.6 7.6 0 0 0 0 7.513c0 1.214.283 2.36.784 3.375L3.233 8.95a4.6 4.6 0 0 1-.231-1.437"
      fill="#FB0"
    />
    <path
      d="M7.37 0C4.49 0 1.997 1.684.784 4.139l2.449 1.937c.584-1.781 2.215-3.102 4.139-3.102 1.086 0 2.06.381 2.828 1.127l2.104-2.143C11.025.745 9.359 0 7.37 0"
      fill="#FF4031"
    />
  </svg>
);

const METHOD_TO_ICON = {
  applePay: <ApplePayIcon />,
  googlePay: <GooglePayIcon />,
};

const METHOD_TO_BUTTON_CLS = {
  applePay: cn('bg-black text-white'),
  googlePay: cn('bg-black text-white'),
};

const afterCls = cn('bg-transparent after:absolute after:inset-0 after:transition after:disabled:bg-transparent');

const loadingCls = cn('shadow-none');

const resetButtonStylesCls = cn(
  'rounded-none p-0 leading-none font-normal shadow-none hover:filter-none focus:filter-none active:filter-none',
);

export const WalletPaymentButton = forwardRef<
  HTMLButtonElement,
  {
    method: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
    isLoading: boolean;
    disabled?: boolean;
  }
>(({ method, onClick, isLoading, disabled }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    type="submit"
    tabIndex={0}
    disabled={disabled}
    className={cn(
      resetButtonStylesCls,
      `
        relative flex h-14 items-center justify-center overflow-hidden rounded-lg p-0 shadow-raised transition
        active:shadow-none
        disabled:opacity-50 disabled:shadow-none
      `,
      afterCls,
      METHOD_TO_BUTTON_CLS[method as keyof typeof METHOD_TO_BUTTON_CLS],
      isLoading && loadingCls,
    )}
  >
    { isLoading ? (<IconLoaderCircle size="large" className="animate-spin" />) : METHOD_TO_ICON[method as keyof typeof METHOD_TO_ICON]}
  </button>
));

WalletPaymentButton.displayName = 'WalletPaymentButton';

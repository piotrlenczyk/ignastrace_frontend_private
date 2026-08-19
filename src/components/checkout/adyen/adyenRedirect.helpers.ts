// Source: adapted from https://github.com/QR-CODE-App/payments-client-kickstart/ with modifications
import { type PaymentAction } from '@adyen/adyen-web';

export const ADYEN_REDIRECT_SOURCE_STORAGE_KEY = 'adyen_redirect_source';

export type AdyenRedirectSource = 'card' | 'googlePay' | 'applePay';

export const isRedirectAction = (action: unknown): action is { type: string } => {
  if (!action || typeof action !== 'object') {
    return false;
  }
  return 'type' in action && action.type === 'redirect';
};

export const isThreeDs2Action = (action: unknown): action is PaymentAction => {
  if (!action || typeof action !== 'object') {
    return false;
  }
  return 'type' in action && action.type === 'threeDS2';
};

export const getCleanReturnUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('redirectResult');
  url.searchParams.delete('payload');
  return url.toString();
};

export const getRedirectResultFromLocation = () => {
  const url = new URL(window.location.href);
  return url.searchParams.get('redirectResult');
};

export const clearRedirectParamsFromLocation = () => {
  const url = new URL(window.location.href);
  const hasRedirectResult = url.searchParams.has('redirectResult');
  const hasPayload = url.searchParams.has('payload');
  url.searchParams.delete('redirectResult');
  url.searchParams.delete('payload');
  if (!hasRedirectResult && !hasPayload) {
    return;
  }
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
};

export const setAdyenRedirectSource = (source: AdyenRedirectSource) => {
  window.sessionStorage.setItem(ADYEN_REDIRECT_SOURCE_STORAGE_KEY, source);
};

export const getAdyenRedirectSource = (): AdyenRedirectSource | null => {
  const source = window.sessionStorage.getItem(ADYEN_REDIRECT_SOURCE_STORAGE_KEY);

  return source === 'card' || source === 'googlePay' || source === 'applePay' ? source : null;
};

export const clearAdyenRedirectSource = () => {
  window.sessionStorage.removeItem(ADYEN_REDIRECT_SOURCE_STORAGE_KEY);
};

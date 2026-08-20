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

/**
 * Whether a screen is being rendered for a shopper coming back from a
 * redirect-based Adyen challenge, as far as the address can say.
 *
 * A server render cannot check the recorded redirect source — that lives in the
 * browser's session storage — so the address is all it has, and it is enough for
 * the one decision a server render makes about it: a screen that redirects an
 * authenticated visitor elsewhere must stand aside, because the payment is only
 * completed once the checkout island has been rendered again. Sending them to the
 * member area instead takes their money and never finishes the sale.
 *
 * A visitor arriving with a hand-typed or stale parameter therefore also skips
 * the redirect, and lands on a checkout screen that completes nothing. That is
 * the safe direction to be wrong in.
 */
export const hasAdyenRedirectResult = (redirectResult: string | string[] | undefined): boolean =>
  Array.isArray(redirectResult) ? redirectResult.some(Boolean) : !!redirectResult;

/**
 * Whether the visitor in front of a screen is a shopper coming back from a
 * redirect-based Adyen challenge that this application started.
 *
 * Both signals have to be present. A redirect result on its own is a stale link
 * or a hand-typed parameter — nothing here started a challenge for it, so there
 * is nothing to submit. A recorded source on its own is a challenge somebody
 * walked away from, and carries no result either. Only the pair means a payment
 * is waiting to be finished, which is the one condition under which a screen
 * must mount the checkout island without anybody asking it to.
 *
 * It takes the two signals rather than reading them, so the trickiest condition
 * in a redirect-resumed payment is a pure function a test can state rather than
 * something only a browser can answer.
 */
export const isResumingAdyenRedirect = ({
  redirectSource,
  redirectResult,
}: {
  redirectSource: AdyenRedirectSource | null;
  redirectResult: string | null;
}): boolean => !!redirectSource && !!redirectResult;

export const clearAdyenRedirectSource = () => {
  window.sessionStorage.removeItem(ADYEN_REDIRECT_SOURCE_STORAGE_KEY);
};

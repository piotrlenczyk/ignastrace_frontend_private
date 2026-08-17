import { CardNumberElement } from '@stripe/react-stripe-js';
import type {
  PaymentIntent,
  PaymentRequestPaymentMethodEvent,
  Stripe,
  StripeElements,
  StripeError,
} from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import validator from 'validator';

import { $api } from '@/network/api/api-browser-client';
import type { StripeFormValues } from '@/types/stripe-form.types';
import type { Subscription } from '@/types/subscription';
import type { SubscriptionIntent } from '@/types/subscription-intent';
import { getTrackingData } from '@/utils/tracking';

import { useApi } from '../use-api';

export function useConfirmStripePaymentMutation({
  stripe,
  isReactivate,
  skipTrial = isReactivate,
  isUpdatePaymentMethod = false,
  onSuccess,
  onError,
}: {
  stripe: Stripe | null;
  isReactivate: boolean;
  skipTrial?: boolean;
  isUpdatePaymentMethod?: boolean;
  onSuccess: (data: { paymentIntent: PaymentIntent }) => void;
  onError: (error: StripeError) => void;
}) {
  const api = useApi();
  const { mutate: updateProfile } = $api.useMutation('put', '/api/v1/user');

  /*
   * The name from the card, carried onto the account so it has one even when the
   * member never typed it into a form. Fire-and-forget, as it has always been:
   * a payment that went through is not undone by a profile that did not.
   *
   * TODO: [refactor] the postal code and the country stop reaching the backend
   * here — the new profile request body has no field for either. The postal code
   * still reaches Stripe through the payment method's billing details, and the
   * country was derived from geolocation rather than entered, so nothing the
   * member typed is lost; but nothing is written to the account either. Restore
   * both when the endpoint grows the fields.
   */
  function updateUserInfo(name?: string) {
    if (!name) {
      return;
    }

    updateProfile({ body: { name } });
  }

  async function syncSubscription(paymentIntentStripeId: string) {
    const subscription = await api.post<Subscription>('/subscription/sync', {
      payment_intent_stripe_id: paymentIntentStripeId,
    });

    if (subscription.status !== 'active') {
      throw new Error('Subscription not active');
    }
  }

  async function updatePaymentMethod(paymentMethodId: string) {
    const response = await api.put<Record<string, unknown>>('/subscription/update_payment_method', {
      payment_method_id: paymentMethodId,
    });

    if (!response.success) {
      throw new Error('Failed to update payment method');
    }

    return response;
  }

  async function payWithCard(
    stripe: Stripe,
    elements: StripeElements,
    data: StripeFormValues,
    email: string,
    currency: string,
    trackingData: Record<string, string>,
  ) {
    const card = elements.getElement(CardNumberElement);

    const addressData =
      data.zipCode && validator.isPostalCode(data.zipCode, 'any') ? { postal_code: data.zipCode } : {};

    if (!card) {
      throw new Error('Card element not found');
    }

    const paymentMethodResult = await stripe.createPaymentMethod({
      type: 'card',
      card,
      billing_details: {
        name: data.cardName,
        email,
        address: addressData,
      },
    });

    const paymentMethodId = paymentMethodResult?.paymentMethod?.id;
    if (!paymentMethodId) {
      throw new Error('Unable to create payment method.');
    }

    if (isUpdatePaymentMethod) {
      await updatePaymentMethod(paymentMethodId);

      if (!isReactivate) {
        updateUserInfo(data.cardName);
      }

      return { paymentIntent: { id: 'update_payment_method_success' } as PaymentIntent };
    } else {
      const subscription = await api.post<SubscriptionIntent>('/subscription', {
        currency,
        payment_method_id: paymentMethodId,
        tracking_data: trackingData,
        skip_trial: skipTrial,
      });

      if (!isReactivate) {
        updateUserInfo(data.cardName);
      }

      const result = await stripe.confirmCardPayment(subscription.client_secret, { payment_method: paymentMethodId });

      if (result.error) {
        throw result.error;
      }

      return result;
    }
  }

  async function payWithWallet(
    stripe: Stripe,
    data: PaymentRequestPaymentMethodEvent,
    currency: string,
    trackingData: Record<string, string>,
  ) {
    const { complete, paymentMethod, payerName } = data;

    try {
      const paymentMethodId = paymentMethod.id;

      if (isUpdatePaymentMethod) {
        await updatePaymentMethod(paymentMethodId);

        if (!isReactivate) {
          updateUserInfo(payerName);
        }

        complete('success');

        return { paymentIntent: { id: 'update_payment_method_success' } as PaymentIntent };
      } else {
        const subscription = await api.post<SubscriptionIntent>('/subscription', {
          currency,
          payment_method_id: paymentMethodId,
          tracking_data: trackingData,
          skip_trial: skipTrial,
        });

        if (!isReactivate) {
          updateUserInfo(payerName);
        }

        const result = await stripe.confirmCardPayment(subscription.client_secret, {
          payment_method: paymentMethodId,
        });

        if (result.error) {
          complete('fail');
          throw result.error;
        } else {
          complete('success');
        }

        return result;
      }
    } catch (error) {
      complete('fail');
      throw error;
    }
  }

  async function confirmStripePayment({
    data,
    email,
    currency,
    elements,
  }: {
    data: StripeFormValues | PaymentRequestPaymentMethodEvent;
    email: string;
    currency: string;
    elements: StripeElements | null;
  }) {
    if (!elements) {
      throw new Error('Elements not found');
    }

    if (!stripe || !elements) {
      throw new Error('Stripe or elements not found');
    }
    if (!currency) {
      throw new Error('Currency not found');
    }

    const trackingData = getTrackingData();

    const result =
      'complete' in data && 'paymentMethod' in data
        ? await payWithWallet(stripe, data, currency, trackingData)
        : await payWithCard(stripe, elements, data, email, currency, trackingData);

    if (!isUpdatePaymentMethod) {
      await syncSubscription(result.paymentIntent.id);
    }

    return result;
  }

  return useMutation({
    mutationFn: confirmStripePayment,
    onSuccess,
    onError,
  });
}

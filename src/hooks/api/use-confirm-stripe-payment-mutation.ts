import { CardNumberElement } from '@stripe/react-stripe-js';
import type { PaymentRequestPaymentMethodEvent, Stripe, StripeElements } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import validator from 'validator';

import { $api } from '@/network/api/api-browser-client';
import {
  type StripeSubscriptionPaymentUpdate,
  useUpdateStripePaymentMethodMutation,
} from '@/network/payments-api/hooks/use-update-stripe-payment-method-mutation';
import type { StripeFormValues } from '@/types/stripe-form.types';

/**
 * Collects a card — typed or handed over by a wallet — and puts it on the
 * caller's subscription.
 *
 * It used to do two jobs: this one, and starting a subscription. The second was
 * unreachable, since the one form that mounts this hook only ever asks for a card
 * change, and its two legacy calls went with it.
 */
export function useConfirmStripePaymentMutation({
  stripe,
  onSuccess,
  onError,
}: {
  stripe: Stripe | null;
  onSuccess: (data: StripeSubscriptionPaymentUpdate) => void;
  /**
   * A Stripe error from collecting or confirming the card, or the body the
   * payments service refused the change with. Which of the two it is decides
   * nothing at the only call site — it reports one message for either — so the
   * type says what can arrive rather than naming one of them.
   */
  onError: (error: unknown) => void;
}) {
  const { mutate: updateProfile } = $api.useMutation('put', '/api/v1/user');
  const { mutateAsync: updateStripePaymentMethod } = useUpdateStripePaymentMethodMutation();

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

  /**
   * Puts the collected card on the subscription the payments service holds for
   * this session, and sees through the charge that endpoint attempts at once.
   *
   * The legacy predecessor answered `{ success: boolean }` with a 200 either way,
   * so the only thing to do with a refusal was to throw a message of this
   * application's own invention. Now the refusal is the service's, and it travels
   * as it arrived.
   *
   * A client secret in the answer means the immediate charge needs the cardholder
   * present, and the confirmation is read exactly as the checkout island reads
   * it — its absence means there was nothing to confirm. The subscription
   * `status` is deliberately not branched on beyond that: the service publishes
   * no enumeration for it, and inventing one here would be guessing at which
   * values are a card change that failed.
   */
  async function updatePaymentMethod(stripe: Stripe, paymentMethodId: string) {
    const update = await updateStripePaymentMethod({ body: { paymentMethodId } });

    if (update.clientSecret) {
      const { error } = await stripe.confirmCardPayment(update.clientSecret);

      if (error) {
        throw error;
      }
    }

    return update;
  }

  async function payWithCard(
    stripe: Stripe,
    elements: StripeElements,
    data: StripeFormValues,
    email: string,
  ): Promise<StripeSubscriptionPaymentUpdate> {
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

    const update = await updatePaymentMethod(stripe, paymentMethodId);

    updateUserInfo(data.cardName);

    return update;
  }

  async function payWithWallet(
    stripe: Stripe,
    data: PaymentRequestPaymentMethodEvent,
  ): Promise<StripeSubscriptionPaymentUpdate> {
    const { complete, paymentMethod, payerName } = data;

    try {
      const update = await updatePaymentMethod(stripe, paymentMethod.id);

      updateUserInfo(payerName);

      complete('success');

      return update;
    } catch (error) {
      complete('fail');
      throw error;
    }
  }

  async function confirmStripePayment({
    data,
    email,
    elements,
  }: {
    data: StripeFormValues | PaymentRequestPaymentMethodEvent;
    email: string;
    elements: StripeElements | null;
  }) {
    if (!stripe || !elements) {
      throw new Error('Stripe or elements not found');
    }

    return 'complete' in data && 'paymentMethod' in data
      ? payWithWallet(stripe, data)
      : payWithCard(stripe, elements, data, email);
  }

  return useMutation({
    mutationFn: confirmStripePayment,
    onSuccess,
    onError,
  });
}

import { deleteCookie, getCookie, setCookie } from 'cookies-next/client';
import { z } from 'zod';

import { SUBSCRIPTION_PLANS } from '@/components/checkout/_shared/types/pricing.types';

export const CHECKOUT_COOKIE_KEY = 'checkout';

const CheckoutDataSchema = z.object({
  id: z.string(),
  plan: z.enum(SUBSCRIPTION_PLANS),
  eventId: z.string().optional(),
  currency: z.string().optional(),
  amount: z.number().optional(),
  email: z.string().optional(),
});

export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

export const parseCheckoutData = (checkoutData?: string): CheckoutData | null => {
  if (!checkoutData) {
    return null;
  }
  const parsed = CheckoutDataSchema.safeParse(JSON.parse(checkoutData));
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

export const getCheckoutCookie = () => {
  return parseCheckoutData(getCookie(CHECKOUT_COOKIE_KEY));
};

export const setCheckoutCookie = (data: CheckoutData) => {
  setCookie(CHECKOUT_COOKIE_KEY, data);
};

export const deleteCheckoutCookie = () => {
  deleteCookie(CHECKOUT_COOKIE_KEY);
};

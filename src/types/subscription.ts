export type SubscriptionStatus = 'initial' | 'incomplete' | 'active' | 'cancelled' | 'expired' | 'incomplete_expired';

export type Subscription = {
  id: string;
  status: SubscriptionStatus;
  created: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at: string | null;
  cancel_at: string | null;
  price: number;
  currency: string;
};

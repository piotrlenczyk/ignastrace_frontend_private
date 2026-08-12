import type { SubscriptionStatus } from './subscription';

export type Upselling =
  | 'support_hotline'
  | 'scan_pro'
  | 'unlimited_pdf_downloads'
  | 'data_leaks'
  | 'sex_offenders'
  | 'sex_offenders_search'
  | 'social_networks';

export type User = {
  id: string;
  email: string;
  locale: string;
  notify_status_changes: boolean;
  notify_user_located: boolean;
  subscription_status: SubscriptionStatus;
  upsellings: Upselling[];
  unread_count: number;
  currency: string;
  purchase_info?: {
    trial_price: number;
    total_price: number;
    upsellings_price: number;
    unlimited_downloads_upsell_available: boolean;
    data_leaks_upsell_available: boolean;
    sex_offenders_upsell_available: boolean;
  };
  onboarding_phone_number: string;
};

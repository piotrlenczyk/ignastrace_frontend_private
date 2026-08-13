'use server';

import { cookies } from 'next/headers';

export type FunnelPlan = 'trial' | 'subscription';

export async function saveFunnelPlan(plan: FunnelPlan) {
  (await cookies()).set('funnelPlan', plan);
}

export async function getFunnelPlan(): Promise<FunnelPlan> {
  const cookiePlan = (await cookies()).get('funnelPlan')?.value;

  return cookiePlan === 'subscription' ? 'subscription' : 'trial';
}

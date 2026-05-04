import { supabase } from './supabase';
import { SubscriptionState, SubscriptionTier } from '../types';

/**
 * Subscription state.
 *
 * For the MVP, the user's tier is stored in `profiles.subscription_tier`.
 * Real IAP integration (App Store / Play Store) is added in v1.1 — at that
 * point this service starts verifying receipts and updating the profile.
 *
 * For now `upgradeToPremium` is a stub that flips the bit directly. This
 * lets you build and test the rest of the app end-to-end before wiring IAP.
 */

export async function fetchSubscription(userId: string): Promise<SubscriptionState> {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier, premium_since, premium_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return { tier: 'free', premiumSince: null, expiresAt: null };
  }
  return {
    tier: (data.subscription_tier as SubscriptionTier) ?? 'free',
    premiumSince: data.premium_since ? new Date(data.premium_since).getTime() : null,
    expiresAt: data.premium_expires_at ? new Date(data.premium_expires_at).getTime() : null,
  };
}

/**
 * Stub: in production this would verify a receipt with Apple/Google,
 * then update the profile. For now we just flip the bit.
 */
export async function upgradeToPremium(userId: string): Promise<SubscriptionState> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'premium',
      premium_since: now,
      premium_expires_at: null, // lifetime for the stub
    })
    .eq('id', userId);

  if (error) throw error;
  return {
    tier: 'premium',
    premiumSince: Date.now(),
    expiresAt: null,
  };
}

export async function downgradeToFree(userId: string): Promise<SubscriptionState> {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      premium_since: null,
      premium_expires_at: null,
    })
    .eq('id', userId);
  if (error) throw error;
  return { tier: 'free', premiumSince: null, expiresAt: null };
}

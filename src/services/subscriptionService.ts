import { Platform } from 'react-native';

import { supabase } from './supabase';
import { SubscriptionState, SubscriptionTier } from '../types';
import { supportsNativeAuth } from '../utils/env';

// ---------------------------------------------------------------------------
// RevenueCat SDK — lazy-loaded to keep Expo Go from crashing.
// ---------------------------------------------------------------------------

const REVENUECAT_API_KEY_IOS = 'appl_gVgIlNTxPgThTRjgTwiccTiDVdA';
const ENTITLEMENT_ID = 'pro';
const OFFERING_ID = 'default';

let _Purchases: typeof import('react-native-purchases') | null = null;
let _rcConfigured = false;

function getPurchases() {
  if (!supportsNativeAuth) return null;
  if (!_Purchases) {
    _Purchases = require('react-native-purchases');
  }
  return _Purchases;
}

/**
 * Configure RevenueCat with the current user's Supabase ID.
 * Call this once on app launch after the user is authenticated.
 * If called multiple times (e.g. user signs out and back in), updates the user ID.
 */
export async function configurePurchases(supabaseUserId: string | null): Promise<void> {
  const rc = getPurchases();
  if (!rc) return;

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : null;
  if (!apiKey) return;

  try {
    if (!_rcConfigured) {
      rc.default.configure({ apiKey, appUserID: supabaseUserId ?? undefined });
      _rcConfigured = true;
    } else if (supabaseUserId) {
      await rc.default.logIn(supabaseUserId);
    } else {
      await rc.default.logOut();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[subscriptionService] configure failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Fetch / sync subscription state
// ---------------------------------------------------------------------------

export async function fetchSubscription(userId: string): Promise<SubscriptionState> {
  // First check RevenueCat (authoritative source for purchase state)
  const rcTier = await checkRevenueCatEntitlement();

  if (rcTier === 'premium') {
    // Make sure Supabase reflects this too (in case of re-install or new device)
    await syncPremiumToSupabase(userId);
    return {
      tier: 'premium',
      premiumSince: Date.now(),
      expiresAt: null,
    };
  }

  // No active entitlement in RevenueCat → fall back to Supabase
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

async function checkRevenueCatEntitlement(): Promise<SubscriptionTier> {
  const rc = getPurchases();
  if (!rc) return 'free';

  try {
    const info = await rc.default.getCustomerInfo();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    return entitlement ? 'premium' : 'free';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[subscriptionService] getCustomerInfo failed:', e);
    return 'free';
  }
}

async function syncPremiumToSupabase(userId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('profiles')
    .update({
      subscription_tier: 'premium',
      premium_since: now,
      premium_expires_at: null,
    })
    .eq('id', userId);
}

// ---------------------------------------------------------------------------
// Purchase flow
// ---------------------------------------------------------------------------

/**
 * Start the IAP flow for the premium lifetime unlock.
 * Triggers Apple's native purchase sheet.
 * Returns the new subscription state on success.
 * Throws if the user cancels or the purchase fails.
 */
export async function upgradeToPremium(userId: string): Promise<SubscriptionState> {
  const rc = getPurchases();
  if (!rc) {
    throw new Error('In-app purchase is only available in production builds.');
  }

  try {
    // Get the offering that has our lifetime package
    const offerings = await rc.default.getOfferings();
    const offering = offerings.all[OFFERING_ID] ?? offerings.current;

    if (!offering) {
      throw new Error('No offering configured. Please contact support.');
    }

    const pkg = offering.lifetime ?? offering.availablePackages[0];
    if (!pkg) {
      throw new Error('No purchase package available. Please contact support.');
    }

    // Trigger Apple's purchase sheet
    const result = await rc.default.purchasePackage(pkg);

    // Check entitlement was granted
    const entitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) {
      throw new Error('Purchase completed but entitlement not active. Try Restore Purchases.');
    }

    // Sync to Supabase so other devices see premium too
    await syncPremiumToSupabase(userId);

    return {
      tier: 'premium',
      premiumSince: Date.now(),
      expiresAt: null,
    };
  } catch (e: any) {
    if (e?.userCancelled) {
      throw new Error('Purchase cancelled');
    }
    throw e;
  }
}

/**
 * Restore prior purchases. Used when a user reinstalls or switches devices.
 */
export async function restorePurchases(userId: string): Promise<SubscriptionState> {
  const rc = getPurchases();
  if (!rc) {
    throw new Error('Restore purchases is only available in production builds.');
  }

  try {
    const info = await rc.default.restorePurchases();
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];

    if (entitlement) {
      await syncPremiumToSupabase(userId);
      return {
        tier: 'premium',
        premiumSince: Date.now(),
        expiresAt: null,
      };
    }

    return { tier: 'free', premiumSince: null, expiresAt: null };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[subscriptionService] restore failed:', e);
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Get localized price (for paywall display)
// ---------------------------------------------------------------------------

/**
 * Fetch the localized price string for the premium product
 * (e.g. "$19.99", "€19.99", "CHF 19.00" depending on user's country).
 * Returns null if RevenueCat isn't available or the product can't be fetched.
 */
export async function getLocalizedPrice(): Promise<string | null> {
  const rc = getPurchases();
  if (!rc) return null;

  try {
    const offerings = await rc.default.getOfferings();
    const offering = offerings.all[OFFERING_ID] ?? offerings.current;
    if (!offering) return null;

    const pkg = offering.lifetime ?? offering.availablePackages[0];
    return pkg?.product.priceString ?? null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[subscriptionService] getLocalizedPrice failed:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Downgrade (test-only — Apple doesn't allow real refunds via SDK)
// ---------------------------------------------------------------------------

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

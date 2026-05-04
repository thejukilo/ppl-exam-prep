import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionState } from '../../types';

const initialState: SubscriptionState = {
  tier: 'free',
  premiumSince: null,
  expiresAt: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (_state, action: PayloadAction<SubscriptionState>) => action.payload,
    reset: () => initialState,
  },
});

export const { setSubscription, reset } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

import type { RootState } from '../store';

export const selectIsPremium = (s: RootState) => s.subscription.tier === 'premium';
export const selectSubscription = (s: RootState) => s.subscription;

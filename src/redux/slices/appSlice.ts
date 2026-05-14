import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  /** Has the user completed (or skipped) the onboarding flow on this device? */
  onboardingCompleted: boolean;
}

const initialState: AppState = {
  onboardingCompleted: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
  },
});

export const { setOnboardingCompleted } = appSlice.actions;
export default appSlice.reducer;

import type { RootState } from '../store';
export const selectOnboardingCompleted = (s: RootState) =>
  s.app.onboardingCompleted;

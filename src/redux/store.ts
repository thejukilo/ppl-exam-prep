import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import questionsReducer from './slices/questionsSlice';
import progressReducer, { hydrate as hydrateProgress } from './slices/progressSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import appReducer, { setOnboardingCompleted } from './slices/appSlice';
import sessionsReducer, { hydrateSessions } from './slices/sessionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    questions: questionsReducer,
    progress: progressReducer,
    subscription: subscriptionReducer,
    app: appReducer,
    sessions: sessionsReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ---------------------------------------------------------------------------
// Persistence: load progress + onboarding flag from AsyncStorage on boot,
// write progress on every change.
// ---------------------------------------------------------------------------

const PROGRESS_KEY = 'progress_state_v1';
const SESSIONS_KEY = 'sessions_state_v1';
export const ONBOARDING_FLAG = 'onboarding_completed_v1';

export async function bootstrapStore(): Promise<void> {
  // Hydrate progress
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (raw) {
      store.dispatch(hydrateProgress(JSON.parse(raw)));
    }
  } catch {
    // ignore
  }

  // Hydrate active sessions
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (raw) {
      store.dispatch(hydrateSessions(JSON.parse(raw)));
    }
  } catch {
    // ignore
  }

  // Hydrate onboarding flag
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_FLAG);
    store.dispatch(setOnboardingCompleted(v === 'true'));
  } catch {
    // ignore — defaults to false, user sees onboarding
  }

  // Persist progress + sessions changes (debounced)
  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  store.subscribe(() => {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      const { progress, sessions } = store.getState();
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
      AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)).catch(() => {});
    }, 500);
  });
}

/**
 * Helper for the OnboardingScreen to mark itself complete + persist.
 * Updates Redux immediately so the navigator re-renders.
 */
export async function markOnboardingComplete(): Promise<void> {
  store.dispatch(setOnboardingCompleted(true));
  try {
    await AsyncStorage.setItem(ONBOARDING_FLAG, 'true');
  } catch {
    // best-effort — Redux state still set, user won't see onboarding again this session
  }
}

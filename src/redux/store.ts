import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import questionsReducer from './slices/questionsSlice';
import progressReducer, { hydrate as hydrateProgress } from './slices/progressSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    questions: questionsReducer,
    progress: progressReducer,
    subscription: subscriptionReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ---------------------------------------------------------------------------
// Persistence: load progress from AsyncStorage on boot, write on every change
// ---------------------------------------------------------------------------

const PROGRESS_KEY = 'progress_state_v1';

export async function bootstrapStore(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (raw) {
      store.dispatch(hydrateProgress(JSON.parse(raw)));
    }
  } catch {
    // ignore
  }

  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  store.subscribe(() => {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      const { progress } = store.getState();
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
    }, 500);
  });
}

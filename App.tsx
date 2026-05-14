import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert } from 'react-native';
import { useFonts } from 'expo-font';

import { store, bootstrapStore, useAppDispatch, useAppSelector } from './src/redux/store';
import { setUser, setInitializing } from './src/redux/slices/authSlice';
import {
  questionsLoading,
  questionsLoaded,
  questionsError,
} from './src/redux/slices/questionsSlice';
import { setSubscription } from './src/redux/slices/subscriptionSlice';
import { hydrate as hydrateProgress } from './src/redux/slices/progressSlice';

import { getCurrentUser, onAuthStateChange } from './src/services/authService';
import { fetchAllQuestions } from './src/services/questionsService';
import { fetchSubscription } from './src/services/subscriptionService';
import { fetchAttempts } from './src/services/progressService';

import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingSpinner } from './src/components/LoadingSpinner';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { fontMap } from './src/utils/fonts';

/**
 * Boot sequence:
 *   1. Load fonts (Nunito).
 *   2. Hydrate persisted Redux progress from AsyncStorage.
 *   3. Check for an existing Supabase session — DO NOT auto-create
 *      anonymous users anymore (the Welcome screen handles that).
 *   4. If signed in: load questions, subscription, remote attempts.
 *   5. Subscribe to auth state changes.
 *
 * The signed-in vs signed-out branch is handled in RootNavigator based
 * on `auth.user`.
 */

function Bootstrapper({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [questionsBootstrapped, setQuestionsBootstrapped] = useState(false);

  // Initial boot: hydrate store + restore session
  useEffect(() => {
    let unsubscribe = () => {};

    (async () => {
      await bootstrapStore();

      const existing = await getCurrentUser();
      dispatch(setUser(existing));
      dispatch(setInitializing(false));

      unsubscribe = onAuthStateChange((u) => dispatch(setUser(u)));
    })();

    return () => unsubscribe();
  }, [dispatch]);

  // When a user signs in (including anonymously), load their data.
  useEffect(() => {
    if (!user) {
      setQuestionsBootstrapped(false);
      return;
    }

    let cancelled = false;
    (async () => {
      // Questions only need to be loaded once per session.
      if (!questionsBootstrapped) {
        dispatch(questionsLoading());
        try {
          const qs = await fetchAllQuestions();
          if (!cancelled) {
            dispatch(questionsLoaded(qs));
            setQuestionsBootstrapped(true);
          }
        } catch (e: any) {
          if (!cancelled) {
            dispatch(questionsError(e?.message ?? 'Failed to load questions'));
            Alert.alert(
              'Could not load questions',
              'Check your internet connection and try again.'
            );
          }
        }
      }

      // Subscription state.
      try {
        const sub = await fetchSubscription(user.id);
        if (!cancelled) dispatch(setSubscription(sub));
      } catch {
        // ignore — defaults to free
      }

      // Remote attempts (best effort).
      try {
        const remote = await fetchAttempts(user.id);
        if (remote.length && !cancelled) {
          const byId: Record<string, typeof remote[number]> = {};
          for (const a of remote) byId[a.questionId] = a;
          dispatch(hydrateProgress({ attemptsByQuestion: byId }));
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, dispatch, questionsBootstrapped]);

  return <>{children}</>;
}

export default function App() {
  const [fontsLoaded] = useFonts(fontMap);

  if (!fontsLoaded) {
    return <LoadingSpinner message="Loading…" />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <Bootstrapper>
              <RootNavigator />
            </Bootstrapper>
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

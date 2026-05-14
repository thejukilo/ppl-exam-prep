import { Platform } from 'react-native';

import { supabase } from './supabase';
import { AppUser } from '../types';
import { isExpoGo, supportsNativeAuth, getRuntimeExtras } from '../utils/env';

// ---------------------------------------------------------------------------
// Lazy-loaded native modules
// ---------------------------------------------------------------------------
//
// `expo-apple-authentication` and `@react-native-google-signin/google-signin`
// are NATIVE modules — they require platform code that's only present in
// development builds (not in Expo Go). Importing them at the top level
// would crash Expo Go on launch with a TurboModuleRegistry error.
//
// Instead we lazy-require them only when their function is actually called,
// inside an `if (supportsNativeAuth)` guard, so the module never resolves
// in Expo Go and we can show a friendly message instead.

let _AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
let _GoogleSignin: typeof import('@react-native-google-signin/google-signin') | null = null;
let _googleConfigured = false;

function getAppleAuth() {
  if (!supportsNativeAuth) return null;
  if (!_AppleAuthentication) {
    _AppleAuthentication = require('expo-apple-authentication');
  }
  return _AppleAuthentication;
}

function getGoogleSignin() {
  if (!supportsNativeAuth) return null;
  if (!_GoogleSignin) {
    _GoogleSignin = require('@react-native-google-signin/google-signin');
  }

  // Configure once on first use
  if (!_googleConfigured && _GoogleSignin) {
    const extra = getRuntimeExtras();
    const webClientId = (extra.googleWebClientId as string) || '';
    const iosClientId = (extra.googleIosClientId as string) || '';

    if (webClientId) {
      _GoogleSignin.GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: false,
      });
      _googleConfigured = true;
    }
  }
  return _GoogleSignin;
}

// ---------------------------------------------------------------------------
// Capability flags (consumed by the UI to hide unsupported buttons)
// ---------------------------------------------------------------------------

export const authCapabilities = {
  apple: supportsNativeAuth && Platform.OS === 'ios',
  google: supportsNativeAuth,
  email: true,
  anonymous: true,
};

/**
 * Friendly message shown when a user taps an unsupported provider in Expo Go.
 */
const EXPO_GO_MSG =
  'Apple and Google Sign-In are only available in a development build. ' +
  'Use email or guest mode in Expo Go.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapUser(
  u: { id: string; email?: string | null; is_anonymous?: boolean } | null
): AppUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    isAnonymous: !!u.is_anonymous,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<AppUser | null> {
  const { data } = await supabase.auth.getUser();
  return mapUser(data.user as any);
}

export async function signUpWithEmail(email: string, password: string): Promise<AppUser> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-up returned no user');
  return mapUser(data.user as any)!;
}

export async function signInWithEmail(email: string, password: string): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-in returned no user');
  return mapUser(data.user as any)!;
}

export async function signInAnonymously(): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Anonymous sign-in returned no user');
  return mapUser(data.user as any)!;
}

/**
 * Apple Sign-In (iOS only, dev/production builds only — not Expo Go).
 */
export async function signInWithApple(): Promise<AppUser> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }
  const apple = getAppleAuth();
  if (!apple) {
    throw new Error(EXPO_GO_MSG);
  }

  const credential = await apple.signInAsync({
    requestedScopes: [
      apple.AppleAuthenticationScope.FULL_NAME,
      apple.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a user for Apple sign-in');
  return mapUser(data.user as any)!;
}

/**
 * Google Sign-In (iOS + Android, dev/production builds only — not Expo Go).
 */
export async function signInWithGoogle(): Promise<AppUser> {
  const google = getGoogleSignin();
  if (!google) {
    throw new Error(EXPO_GO_MSG);
  }

  const extra = getRuntimeExtras();
  if (!extra.googleWebClientId) {
    throw new Error(
      'Google Sign-In is not configured. Set GOOGLE_WEB_CLIENT_ID in .env and rebuild.'
    );
  }

  await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await google.GoogleSignin.signIn();

  // Library returns either { type: 'success', data: { idToken } } in newer
  // versions or { idToken } directly in older. Handle both.
  const idToken =
    (result as any)?.data?.idToken ?? (result as any)?.idToken ?? null;

  if (!idToken) {
    throw new Error('Google did not return an ID token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a user for Google sign-in');
  return mapUser(data.user as any)!;
}

export async function signOut(): Promise<void> {
  // Sign out of any third-party providers too, so next launch fully resets.
  // Only attempt this if Google Signin was loaded (i.e. dev build).
  const google = _GoogleSignin;
  if (google) {
    try {
      await google.GoogleSignin.signOut();
    } catch {
      // Not signed in — ignore
    }
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Send a password-reset email to the given address.
 *
 * Supabase emails the user a link that, when tapped, opens a Supabase-hosted
 * page where they can set a new password. The user does not need to be signed
 * in for this to work.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export function onAuthStateChange(cb: (user: AppUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(mapUser(session?.user as any));
  });
  return () => data.subscription.unsubscribe();
}

// Re-export for convenience
export { isExpoGo };

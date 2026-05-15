import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
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

  // Configure once on first use.
  // Hardcoded as fallback because runtime extras (Constants.expoConfig.extra)
  // are unreliable in production builds — when env vars weren't present at
  // build time, these end up empty and the native SDK crashes on sign-in.
  // OAuth client IDs are not secrets (they're in the IPA anyway), so safe to hardcode.
  if (!_googleConfigured && _GoogleSignin) {
    const extra = getRuntimeExtras();
    const webClientId =
      (extra.googleWebClientId as string) ||
      '76630924595-en16d9mr1hs9fluorq8gl5a7vu3gd137.apps.googleusercontent.com';
    const iosClientId =
      (extra.googleIosClientId as string) ||
      '76630924595-ttbiktrq9umc0vfu8hn9grk1sakkm7o3.apps.googleusercontent.com';

    try {
      _GoogleSignin.GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: false,
      });
      _googleConfigured = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[authService] GoogleSignin.configure failed:', e);
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
 * Uses a nonce to satisfy Supabase's signInWithIdToken requirement.
 */
export async function signInWithGoogle(): Promise<AppUser> {
  const google = getGoogleSignin();
  if (!google) {
    throw new Error(EXPO_GO_MSG);
  }

  // hasPlayServices is Android-only. Calling it on iOS can cause a native
  // exception because the method may not be exposed by the iOS module.
  if (Platform.OS === 'android') {
    await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  // Generate a nonce: a random string we send to Google (hashed),
  // and a plain version we send to Supabase. Supabase verifies the hash
  // inside the ID token matches our plain nonce.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  // Pass the hashed nonce to Google. The returned ID token will contain it.
  const result = await google.GoogleSignin.signIn({ nonce: hashedNonce });

  const idToken =
    (result as any)?.data?.idToken ?? (result as any)?.idToken ?? null;

  if (!idToken) {
    throw new Error('Google did not return an ID token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a user for Google sign-in');
  return mapUser(data.user as any)!;
}

/**
 * Permanently delete the user's account.
 * Calls a Supabase RPC that:
 *  - Removes all rows in app tables tied to this user
 *  - Deletes the auth.users row itself
 * After this, the user is fully signed out and cannot recover their data.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;

  // Sign out locally to clear the session
  const google = _GoogleSignin;
  if (google) {
    try {
      await google.GoogleSignin.signOut();
    } catch {
      // Not signed in — ignore
    }
  }
  await supabase.auth.signOut();
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
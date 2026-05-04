import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

import { supabase } from './supabase';
import { AppUser } from '../types';

// ---------------------------------------------------------------------------
// Google Sign-In configuration
// ---------------------------------------------------------------------------
//
// Configure once on module load. The webClientId is the OAuth 2.0 client ID
// from Google Cloud Console (type: Web application). On iOS we additionally
// pass the iOS-specific client ID; on Android we use the web client ID only
// (Android uses the SHA-1 of the signing cert + package name to identify
// the app, no client-side ID needed for the basic flow).
//
// See docs/AUTH_SETUP.md for how to obtain these values.

const extra = Constants.expoConfig?.extra ?? {};
const googleWebClientId = (extra.googleWebClientId as string) || '';
const googleIosClientId = (extra.googleIosClientId as string) || '';

GoogleSignin.configure({
  webClientId: googleWebClientId,
  iosClientId: googleIosClientId,
  offlineAccess: false,
});

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
 * Apple Sign-In (iOS only).
 *
 * Flow:
 *   1. Ask Apple for an identity token via expo-apple-authentication.
 *   2. Hand that token to Supabase to create/sign-in the user.
 *
 * Requires: enabled "Sign in with Apple" capability in your Apple Developer
 * account, and Apple as a provider in Supabase Auth settings.
 */
export async function signInWithApple(): Promise<AppUser> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
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
 * Google Sign-In (iOS + Android).
 *
 * Flow:
 *   1. Native Google Sign-In returns an idToken.
 *   2. Pass it to Supabase to create/sign-in the user.
 */
export async function signInWithGoogle(): Promise<AppUser> {
  if (!googleWebClientId) {
    throw new Error(
      'Google Sign-In is not configured. Set GOOGLE_WEB_CLIENT_ID in .env and rebuild.'
    );
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();

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
  try {
    await GoogleSignin.signOut();
  } catch {
    // Not signed in — ignore
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(cb: (user: AppUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(mapUser(session?.user as any));
  });
  return () => data.subscription.unsubscribe();
}

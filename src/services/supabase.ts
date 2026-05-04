import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase client.
 *
 * Reads SUPABASE_URL and SUPABASE_ANON_KEY from app.json `extra`
 * (which itself reads from .env via app.config.js / EAS).
 *
 * Auth session is persisted in AsyncStorage so the user stays logged in
 * across app restarts.
 */

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = (extra.supabaseUrl as string) || '';
const supabaseAnonKey = (extra.supabaseAnonKey as string) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_ANON_KEY is missing. ' +
      'Set them in mobile/.env and they will be picked up by app.config.js.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

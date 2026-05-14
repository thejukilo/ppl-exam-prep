import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { getRuntimeExtras } from '../utils/env';

/**
 * Supabase client.
 *
 * Reads SUPABASE_URL and SUPABASE_ANON_KEY from the runtime config (which
 * comes from app.config.js's `extra` block, which itself reads from .env
 * locally or EAS env vars at build time).
 *
 * Note: in production builds, `Constants.expoConfig` can be null even when
 * `Constants.manifest2` has the data. The `getRuntimeExtras` helper checks
 * all known paths.
 *
 * Auth session is persisted in AsyncStorage so the user stays logged in
 * across app restarts.
 */

const extra = getRuntimeExtras();
const supabaseUrl = (extra.supabaseUrl as string) || '';
const supabaseAnonKey = (extra.supabaseAnonKey as string) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_ANON_KEY is missing from runtime config. ' +
      'Make sure they are set as EAS env vars for the build profile in use.'
  );
}

// IMPORTANT: createClient throws synchronously if URL is empty. We provide
// a placeholder so the app doesn't immediately crash with a white screen —
// instead, network calls will fail with a clear error we can surface.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

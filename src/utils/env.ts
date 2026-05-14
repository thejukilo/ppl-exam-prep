import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Runtime environment detection.
 *
 * Expo Go is a generic app on the App Store / Play Store — it cannot include
 * arbitrary native modules. So at runtime we need to know whether we're in
 * Expo Go (skip native auth modules, show graceful messages) or in a
 * development/production build (use them normally).
 */

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isDevBuild =
  Constants.executionEnvironment === ExecutionEnvironment.Bare ||
  Constants.executionEnvironment === ExecutionEnvironment.Standalone;

/**
 * Whether native auth modules (Apple Sign-In, Google Sign-In) can be used.
 * False in Expo Go, true in dev/standalone builds.
 */
export const supportsNativeAuth = !isExpoGo;

/**
 * Read `extra` config (from app.config.js's `extra` block) reliably across
 * Expo Go, dev builds, and production TestFlight/App Store builds.
 *
 * In production builds, `Constants.expoConfig` can be null even when other
 * Constants paths have the data. Try every known path and return the first
 * one with values.
 */
export function getRuntimeExtras(): Record<string, any> {
  const fromExpoConfig = Constants.expoConfig?.extra;
  if (fromExpoConfig && Object.keys(fromExpoConfig).length > 0) return fromExpoConfig;

  const fromManifest2 = (Constants as any).manifest2?.extra?.expoClient?.extra;
  if (fromManifest2 && Object.keys(fromManifest2).length > 0) return fromManifest2;

  const fromManifest = (Constants as any).manifest?.extra;
  if (fromManifest && Object.keys(fromManifest).length > 0) return fromManifest;

  return {};
}

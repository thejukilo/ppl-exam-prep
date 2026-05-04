// app.config.js — replaces app.json so we can read .env at build time.
// Anything under `extra` is available at runtime via expo-constants.

module.exports = ({ config }) => ({
  ...config,
  name: 'PPL Exam Prep',
  slug: 'ppl-exam-prep',
  version: '0.2.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'pplexamprep',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFD89C',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.jukilo.pplexamprep',
    usesAppleSignIn: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFD89C',
    },
    package: 'com.jukilo.pplexamprep',
  },
  web: {
    favicon: './assets/favicon.png',
  },
plugins: [
  'expo-apple-authentication',
  [
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme: process.env.GOOGLE_IOS_REVERSED_CLIENT_ID,
    },
  ],
  'expo-font',
],
   extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    eas: {
      projectId: 'f3a5f9bc-e0d6-41d6-92d3-d4038411bf1e',
    },
  },
});

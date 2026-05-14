import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAppDispatch } from '../redux/store';
import { setUser } from '../redux/slices/authSlice';
import {
  authCapabilities,
  sendPasswordReset,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../services/authService';
import { isExpoGo } from '../utils/env';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

// AuthScreen is registered under TWO route names:
//   - "Auth" in the signed-out branch (Welcome → Auth modal)
//   - "UpgradeAccount" in the signed-in branch (Profile → Upgrade modal for guests)
// We accept either route key here; behaviour is the same.
type Props =
  | NativeStackScreenProps<RootStackParamList, 'Auth'>
  | NativeStackScreenProps<RootStackParamList, 'UpgradeAccount'>;

export function AuthScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<'signin' | 'signup'>(route.params?.mode ?? 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'apple' | 'google' | null>(null);

  // When this screen was opened from inside the signed-in app (guest upgrading
  // their account), the navigator does NOT swap branches when setUser fires —
  // both states are "signed in". So we have to explicitly dismiss the modal.
  // For the signed-out Auth route, the branch swap unmounts us automatically,
  // so this is harmless there too.
  const isUpgradeFlow = route.name === 'UpgradeAccount';

  const dismissAfterAuth = () => {
    if (isUpgradeFlow && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Lazy-load the AppleAuthentication module ONLY when we know it's safe.
  // In Expo Go, requiring this module crashes the app on import. Wrapping
  // the require in a function keeps it out of the JS bundle's import graph
  // until we actually invoke it.
  const AppleButton = authCapabilities.apple ? requireAppleButton() : null;

  const handleEmail = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    setBusy('email');
    try {
      const user =
        mode === 'signup'
          ? await signUpWithEmail(email, password)
          : await signInWithEmail(email, password);
      dispatch(setUser(user));
      dismissAfterAuth();
    } catch (e: any) {
      Alert.alert(mode === 'signup' ? 'Sign-up failed' : 'Sign-in failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleApple = async () => {
    setBusy('apple');
    try {
      const user = await signInWithApple();
      dispatch(setUser(user));
      dismissAfterAuth();
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy('google');
    try {
      const user = await signInWithGoogle();
      dispatch(setUser(user));
      dismissAfterAuth();
    } catch (e: any) {
      if (e?.code === '-5' || e?.message?.includes('cancelled')) return;
      Alert.alert('Google sign-in failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert(
        'Enter your email',
        'Please type your email address above first, then tap "Forgot password?" again.'
      );
      return;
    }
    Alert.alert(
      'Reset your password?',
      `We'll email password reset instructions to ${email}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send email',
          onPress: async () => {
            try {
              await sendPasswordReset(email);
              Alert.alert(
                'Check your inbox',
                'If an account exists for that email, a reset link has been sent. The link expires in one hour.'
              );
            } catch (e: any) {
              Alert.alert('Could not send', e?.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const showSocials = authCapabilities.apple || authCapabilities.google;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <Text style={[typography.display, styles.title]}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          {mode === 'signup'
            ? 'Sync your progress across devices.'
            : 'Pick up where you left off.'}
        </Text>

        {isExpoGo && (
          <View style={styles.expoGoNotice}>
            <Text style={styles.expoGoText}>
              ℹ️ Running in Expo Go — Apple/Google sign-in require a development build. Use email or guest mode.
            </Text>
          </View>
        )}

        {/* Social providers — only render in dev/standalone builds */}
        {showSocials && (
          <>
            <View style={styles.socials}>
              {AppleButton && (
                <AppleButton
                  mode={mode}
                  onPress={handleApple}
                />
              )}

              {authCapabilities.google && (
                <Pressable
                  onPress={handleGoogle}
                  style={({ pressed }) => [
                    styles.googleButton,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.googleText}>
                    {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or use email</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}

        {/* Email form */}
        <View style={[styles.form, !showSocials && { marginTop: spacing.xl }]}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Button
            title={mode === 'signup' ? 'Create account' : 'Sign in'}
            onPress={handleEmail}
            loading={busy === 'email'}
          />
          {mode === 'signin' && (
            <Pressable
              onPress={handleForgotPassword}
              hitSlop={8}
              style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => setMode((m) => (m === 'signup' ? 'signin' : 'signup'))}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            {mode === 'signup'
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Apple button factory — only ever called when authCapabilities.apple is true.
// Keeps `expo-apple-authentication` out of the import graph for Expo Go.
// ---------------------------------------------------------------------------

function requireAppleButton(): React.FC<{
  mode: 'signin' | 'signup';
  onPress: () => void;
}> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Apple = require('expo-apple-authentication');
  return function AppleButtonInner({ mode, onPress }) {
    return (
      <Apple.AppleAuthenticationButton
        buttonType={
          mode === 'signup'
            ? Apple.AppleAuthenticationButtonType.SIGN_UP
            : Apple.AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={radius.md}
        style={styles.appleButton}
        onPress={onPress}
      />
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: -spacing.lg,
    marginBottom: spacing.md,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  expoGoNotice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expoGoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  socials: { marginTop: spacing.xl, gap: spacing.sm },
  appleButton: { width: '100%', height: 52 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: spacing.md,
  },
  googleG: { fontSize: 20, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.md, color: colors.textMuted, fontSize: 13 },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  toggle: { marginTop: spacing.xl, alignItems: 'center' },
  forgot: { marginTop: spacing.md, alignItems: 'center' },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

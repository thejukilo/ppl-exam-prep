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
import * as AppleAuthentication from 'expo-apple-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAppDispatch } from '../redux/store';
import { setUser } from '../redux/slices/authSlice';
import {
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../services/authService';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<'signin' | 'signup'>(route.params?.mode ?? 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'apple' | 'google' | null>(null);

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
    } catch (e: any) {
      // User cancelled — silent.
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
    } catch (e: any) {
      if (e?.code === '-5' || e?.message?.includes('cancelled')) return;
      Alert.alert('Google sign-in failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

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
        <Text style={[typography.display, styles.title]}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          {mode === 'signup'
            ? 'Sync your progress across devices.'
            : 'Pick up where you left off.'}
        </Text>

        {/* Social providers */}
        <View style={styles.socials}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                mode === 'signup'
                  ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                  : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.md}
              style={styles.appleButton}
              onPress={handleApple}
            />
          )}

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
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email form */}
        <View style={styles.form}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
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
  googleG: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
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
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

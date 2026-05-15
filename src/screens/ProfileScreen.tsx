import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { ONBOARDING_FLAG } from '../redux/store';
import { selectIsPremium, setSubscription } from '../redux/slices/subscriptionSlice';
import { reset as resetProgress } from '../redux/slices/progressSlice';
import { resetSessions } from '../redux/slices/sessionsSlice';
import { setUser } from '../redux/slices/authSlice';
import { setOnboardingCompleted } from '../redux/slices/appSlice';
import { signOut, deleteAccount } from '../services/authService';
import { downgradeToFree } from '../services/subscriptionService';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { APP_CONFIG } from '../config/freemium';
import { isExpoGo } from '../utils/env';
import { RootStackParamList } from '../navigation/RootNavigator';

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector((s) => s.auth.user);
  const isPremium = useAppSelector(selectIsPremium);

  const handleSignOut = async () => {
    Alert.alert('Sign out?', 'Your local progress will stay on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            dispatch(setUser(null));
          } catch (e: any) {
            Alert.alert('Sign out failed', e?.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all your data (progress, bookmarks, premium status). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              dispatch(setUser(null));
              dispatch(resetProgress());
              dispatch(resetSessions());
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset progress?',
      'This will erase your local answers and bookmarks. The free question counter will go back to 0/30. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            dispatch(resetProgress());
            dispatch(resetSessions());
          },
        },
      ]
    );
  };

  const handleStartOver = () => {
    Alert.alert(
      'Start over?',
      'This will sign you out and erase all your local progress, bookmarks, counters, and onboarding state. You will return to the welcome screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start over',
          style: 'destructive',
          onPress: async () => {
            try {
              dispatch(resetProgress());
              dispatch(resetSessions());
              dispatch(setOnboardingCompleted(false));
              try {
                await AsyncStorage.removeItem(ONBOARDING_FLAG);
              } catch {}
              await signOut();
              dispatch(setUser(null));
            } catch (e: any) {
              Alert.alert('Could not sign out', e?.message ?? 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const handleDowngrade = async () => {
    if (!user) return;
    try {
      const sub = await downgradeToFree(user.id);
      dispatch(setSubscription(sub));
    } catch (e: any) {
      Alert.alert('Could not downgrade', e?.message ?? 'Unknown error');
    }
  };

  const isGuest = !user || user.isAnonymous;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[typography.display, styles.title]}>Profile</Text>

        <View style={styles.card}>
          <Text style={[typography.micro, styles.label]}>SIGNED IN AS</Text>
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 4 }]}>
            {user?.email ?? (user?.isAnonymous ? 'Guest' : 'Not signed in')}
          </Text>
          {isGuest && (
            <>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                Create an account to sync progress across devices and unlock Premium.
              </Text>
              <Button
                title="Create account / Sign in"
                onPress={() => navigation.navigate('UpgradeAccount', { mode: 'signup' })}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </View>

        <View style={[styles.card, isPremium && { backgroundColor: colors.premiumBg, borderColor: colors.premium }]}>
          <Text style={[typography.micro, { color: isPremium ? colors.premium : colors.textMuted }]}>
            SUBSCRIPTION
          </Text>
          <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 4 }]}>
            {isPremium ? '✨ Premium' : 'Free'}
          </Text>
          {isPremium ? (
            <Button
              title="Cancel premium (test)"
              variant="ghost"
              onPress={handleDowngrade}
              style={{ marginTop: spacing.md }}
            />
          ) : (
            <Button
              title="Upgrade to Premium"
              onPress={() => navigation.navigate('Paywall')}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={[typography.micro, styles.label]}>DATA</Text>
          {isPremium ? (
            <Button
              title="Reset progress"
              variant="ghost"
              onPress={handleResetProgress}
              style={{ marginTop: spacing.sm }}
            />
          ) : (
            <Button
              title="🔒 Reset progress (Premium)"
              variant="ghost"
              onPress={() => navigation.navigate('Paywall')}
              style={{ marginTop: spacing.sm }}
            />
          )}
          {isExpoGo && (
            <Button
              title="Start over (back to welcome)"
              variant="ghost"
              onPress={handleStartOver}
              style={{ marginTop: spacing.xs }}
            />
          )}
        </View>

 {!isGuest && (
          <>
            <Button title="Sign out" variant="danger" onPress={handleSignOut} />
            <Button
              title="Delete account"
              variant="ghost"
              onPress={handleDeleteAccount}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}

        <Text style={styles.footer}>
          {APP_CONFIG.appName} • {APP_CONFIG.supportEmail}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  title: { color: colors.textPrimary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted },
  footer: {
    color: colors.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: 12,
  },
});

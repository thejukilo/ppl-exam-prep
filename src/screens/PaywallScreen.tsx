import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { setSubscription } from '../redux/slices/subscriptionSlice';
import { upgradeToPremium } from '../services/subscriptionService';
import { FREEMIUM } from '../config/freemium';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const BENEFITS = [
  'All 893 EASA practice questions',
  'Detailed answer explanations',
  'Charts and diagrams for visual questions',
  'Full mock exam mode with timer',
  'Bookmark questions for later',
  'Sync progress across devices',
  'No ads, ever',
];

export function PaywallScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);

  const purchase = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in or continue as guest first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('UpgradeAccount') },
      ]);
      return;
    }
    // TODO: Replace with real IAP via expo-in-app-purchases or RevenueCat.
    // Non-consumable product. Verify the receipt server-side (Edge Function)
    // before flipping the subscription_tier in profiles.
    setBusy(true);
    try {
      const sub = await upgradeToPremium(user.id);
      dispatch(setSubscription(sub));
      Alert.alert(
        'Welcome to Premium!',
        'You now have lifetime access to the full question bank.'
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to restore a previous purchase.');
      return;
    }
    // TODO: Real restore via IAP library — should query past purchases for this Apple/Google
    // account, find the lifetime productId, and re-flip the subscription bit.
    Alert.alert(
      'Restore purchases',
      'Restore is not yet implemented in this build. It will be available when in-app purchases are wired up.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.crown}>👑</Text>
        <Text style={[typography.display, styles.title]}>PPL Prep Premium</Text>
        <Text style={[typography.body, styles.subtitle]}>
          One-time purchase. Lifetime access. No subscription.
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={styles.priceCard}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {FREEMIUM.pricing.lifetime.label.toUpperCase()}
        </Text>
        <Text style={styles.priceText} adjustsFontSizeToFit numberOfLines={1}>
          {FREEMIUM.pricing.lifetime.display}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
          Pay once. No recurring charges.
        </Text>
        <Button
          title="Unlock Lifetime Access"
          loading={busy}
          onPress={purchase}
        />
      </View>

      <Button
        title="Restore Purchase"
        variant="secondary"
        onPress={restore}
        style={{ marginTop: spacing.md }}
      />

      <Text style={[typography.caption, styles.legal]}>
        Payment will be charged to your App Store / Google Play account at confirmation of purchase.
        This is a one-time purchase — there is nothing to cancel.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', marginBottom: spacing.lg },
  crown: { fontSize: 48, marginBottom: spacing.sm },
  title: { color: colors.textPrimary, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  benefits: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  check: { color: colors.success, fontSize: 18, fontWeight: '700' },
  priceCard: {
    backgroundColor: colors.premiumBg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.premium,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  priceText: {
    color: colors.textPrimary,
    fontSize: 44,
    lineHeight: 56,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textAlign: 'center',
    includeFontPadding: false,
  },
  legal: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

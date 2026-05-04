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
  'Unlimited practice questions',
  'Full study guides for every subject',
  'Bookmark questions for later',
  'Detailed answer explanations',
  'Sync progress across devices',
  'No ads, ever',
];

export function PaywallScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const purchase = async (productId: string) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in or continue as guest first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    // TODO: Replace this with real IAP via expo-in-app-purchases or RevenueCat
    // and verify the receipt server-side (Edge Function) before flipping the bit.
    setBusyPlan(productId);
    try {
      const sub = await upgradeToPremium(user.id);
      dispatch(setSubscription(sub));
      Alert.alert('You are Premium', 'Enjoy unlimited practice and full study guides.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Upgrade failed', e?.message ?? 'Unknown error');
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.crown}>👑</Text>
        <Text style={[typography.display, styles.title]}>PPL Prep Premium</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Pass your EASA theory exams with confidence.
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

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <PlanCard
          title="Yearly"
          price={FREEMIUM.pricing.yearly.display}
          badge={FREEMIUM.pricing.yearly.badge}
          highlighted
          loading={busyPlan === FREEMIUM.pricing.yearly.productId}
          onPress={() => purchase(FREEMIUM.pricing.yearly.productId)}
        />
        <PlanCard
          title="Monthly"
          price={FREEMIUM.pricing.monthly.display}
          loading={busyPlan === FREEMIUM.pricing.monthly.productId}
          onPress={() => purchase(FREEMIUM.pricing.monthly.productId)}
        />
        <PlanCard
          title="Lifetime"
          price={FREEMIUM.pricing.lifetime.display}
          loading={busyPlan === FREEMIUM.pricing.lifetime.productId}
          onPress={() => purchase(FREEMIUM.pricing.lifetime.productId)}
        />
      </View>

      <Text style={[typography.caption, styles.legal]}>
        Subscription auto-renews unless cancelled at least 24h before the end of the period. Manage
        in your App Store / Play Store account.
      </Text>
    </ScrollView>
  );
}

interface PlanProps {
  title: string;
  price: string;
  badge?: string;
  highlighted?: boolean;
  loading?: boolean;
  onPress: () => void;
}

function PlanCard({ title, price, badge, highlighted, loading, onPress }: PlanProps) {
  return (
    <View
      style={[
        styles.plan,
        highlighted && {
          borderColor: colors.premium,
          backgroundColor: colors.premiumBg,
          borderWidth: 2,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>
          {price}
        </Text>
      </View>
      <Button
        title="Choose"
        fullWidth={false}
        loading={loading}
        onPress={onPress}
        style={{ paddingHorizontal: spacing.lg }}
      />
    </View>
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
  plan: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.premium,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  legal: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

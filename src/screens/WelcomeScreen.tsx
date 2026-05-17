import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { SkyScene } from '../components/SkyScene';
import { useAppDispatch } from '../redux/store';
import { setUser } from '../redux/slices/authSlice';
import { signInAnonymously } from '../services/authService';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [guestLoading, setGuestLoading] = useState(false);

  // Cap sky scene at 40% of screen on small phones, max 420px on big ones
  const screenHeight = Dimensions.get('window').height;
  const skyHeight = Math.min(420, screenHeight * 0.4);

  const continueAsGuest = async () => {
    setGuestLoading(true);
    try {
      const user = await signInAnonymously();
      dispatch(setUser(user));
      // Navigation switches automatically via auth state in App.tsx
    } catch (e: any) {
      Alert.alert(
        'Could not start guest session',
        e?.message ?? 'Please check your internet connection and try again.'
      );
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SkyScene height={skyHeight} />

      <SafeAreaView style={styles.bottom} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.display, styles.title]}>
            Pass your PPL{'\n'}with confidence
          </Text>
          <Text style={[typography.body, styles.subtitle]}>
            893 EASA exam questions, mock exams, and progress tracking — all in your pocket.
          </Text>

          <View style={styles.actions}>
            <Button
              title="Get started"
              onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            />
            <Button
              title="I already have an account"
              variant="ghost"
              onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue without account"
            variant="secondary"
            onPress={continueAsGuest}
            loading={guestLoading}
          />
          <Text style={styles.guestHint}>
            Free practice on this device. Premium requires an account.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bottom: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
  },
  guestHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
});

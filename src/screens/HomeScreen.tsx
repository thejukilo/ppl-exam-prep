import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TopicCard } from '../components/TopicCard';
import { TOPICS } from '../data/topics';
import { useAppSelector } from '../redux/store';
import { selectAllQuestions } from '../redux/slices/questionsSlice';
import { selectTopicProgress, selectWrongAnsweredIds } from '../redux/slices/progressSlice';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { useFreemium } from '../hooks/useFreemium';
import { FREEMIUM } from '../config/freemium';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList, TabParamList } from '../navigation/RootNavigator';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const questions = useAppSelector(selectAllQuestions);
  const progressByTopic = useAppSelector(selectTopicProgress);
  const isPremium = useAppSelector(selectIsPremium);
  const freemium = useFreemium();
  const wrongIds = useAppSelector(selectWrongAnsweredIds);
  const user = useAppSelector((s) => s.auth.user);

  // Friendly first-name-ish greeting derived from email (e.g. "lode@jukilo.com" -> "Lode").
  // For anonymous guests, fall back to a generic word.
  const friendlyName = useMemo(() => {
    if (!user) return null;
    if (user.isAnonymous) return 'guest';
    if (!user.email) return null;
    const local = user.email.split('@')[0] ?? '';
    // Strip dots/underscores/digits, capitalize first letter
    const cleaned = local.replace(/[._\d-]+/g, ' ').trim().split(/\s+/)[0] ?? '';
    if (!cleaned) return null;
    return cleaned[0].toUpperCase() + cleaned.slice(1).toLowerCase();
  }, [user]);

  // Avatar shows the first letter of the email (or 👤 for anonymous).
  const avatarChar = user?.isAnonymous
    ? '👤'
    : (user?.email?.[0] ?? '?').toUpperCase();

  const topicsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) counts[q.topicId] = (counts[q.topicId] ?? 0) + 1;
    return TOPICS.map((t) => ({ ...t, questionCount: counts[t.id] ?? 0 }));
  }, [questions]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {friendlyName ? (
              <Text style={[typography.caption, styles.greeting]}>
                {greetingForHour()}, {friendlyName} 👋
              </Text>
            ) : null}
            <Text style={[typography.display, styles.title]}>PPL Exam Prep</Text>
            <Text style={[typography.body, styles.subtitle]}>
              EASA Private Pilot Licence — theory practice
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.jumpTo('ProfileTab')}
            hitSlop={8}
            style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>{avatarChar}</Text>
          </Pressable>
        </View>

        {!isPremium && (
          <View style={styles.quotaCard}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Free questions used
              </Text>
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 2 }]}>
                {Math.min(freemium.answeredEver, freemium.lifetimeLimit)} / {freemium.lifetimeLimit}
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <ProgressBar
                  value={Math.min(freemium.answeredEver / freemium.lifetimeLimit, 1)}
                  color={freemium.limitReached ? colors.error : colors.primary}
                />
              </View>
            </View>
            <Button
              title="Unlock"
              onPress={() => navigation.navigate('Paywall')}
              fullWidth={false}
              style={{ marginLeft: spacing.md, paddingHorizontal: spacing.lg }}
            />
          </View>
        )}

        {wrongIds.length > 0 && (
          <View style={styles.mistakesCard}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.micro, styles.mistakesLabel]}>MY MISTAKES</Text>
              <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 2 }]}>
                {wrongIds.length} question{wrongIds.length === 1 ? '' : 's'} to revisit
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {isPremium
                  ? 'Drill the questions you got wrong'
                  : `Preview the first 5 free — Premium unlocks all ${wrongIds.length}`}
              </Text>
            </View>
            <Button
              title={isPremium ? 'Practise' : 'Try 5 free'}
              onPress={() => navigation.navigate('Quiz', { mode: 'review' })}
              fullWidth={false}
              style={{ marginLeft: spacing.md, paddingHorizontal: spacing.md }}
            />
          </View>
        )}

        <Text style={[typography.h2, styles.sectionTitle]}>Subjects</Text>
        {topicsWithCounts.map((topic) => {
          const locked =
            !isPremium && FREEMIUM.lockNonFreeTopicsForFree && !topic.isFree;
          return (
            <TopicCard
              key={topic.id}
              topic={topic}
              progress={progressByTopic[topic.id]}
              locked={locked}
              onPress={() => {
                if (locked) navigation.navigate('Paywall');
                else navigation.navigate('Topic', { topicId: topic.id });
              }}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Friendly time-of-day greeting. Uses the device's local time.
 */
function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greeting: {
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  quotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  sectionTitle: { color: colors.textPrimary, marginBottom: spacing.md },
  mistakesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#FFF4E6',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FFD9A8',
    marginBottom: spacing.xl,
  },
  mistakesLabel: {
    color: '#C66E10',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
});

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TopicCard } from '../components/TopicCard';
import { TOPICS } from '../data/topics';
import { useAppSelector } from '../redux/store';
import { selectAllQuestions } from '../redux/slices/questionsSlice';
import { selectTopicProgress } from '../redux/slices/progressSlice';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { useFreemium } from '../hooks/useFreemium';
import { FREEMIUM } from '../config/freemium';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function HomeScreen({ navigation }: Props) {
  const questions = useAppSelector(selectAllQuestions);
  const progressByTopic = useAppSelector(selectTopicProgress);
  const isPremium = useAppSelector(selectIsPremium);
  const freemium = useFreemium();

  const topicsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) counts[q.topicId] = (counts[q.topicId] ?? 0) + 1;
    return TOPICS.map((t) => ({ ...t, questionCount: counts[t.id] ?? 0 }));
  }, [questions]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[typography.display, styles.title]}>PPL Exam Prep</Text>
          <Text style={[typography.body, styles.subtitle]}>
            EASA Private Pilot Licence — theory practice
          </Text>
        </View>

        {!isPremium && (
          <View style={styles.quotaCard}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Today's free questions
              </Text>
              <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 2 }]}>
                {freemium.answeredToday} / {freemium.dailyLimit}
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <ProgressBar
                  value={freemium.answeredToday / freemium.dailyLimit}
                  color={freemium.limitReached ? colors.error : colors.primary}
                />
              </View>
            </View>
            <Button
              title="Go Pro"
              onPress={() => navigation.navigate('Paywall')}
              fullWidth={false}
              style={{ marginLeft: spacing.md, paddingHorizontal: spacing.lg }}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { marginBottom: spacing.xl },
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
});

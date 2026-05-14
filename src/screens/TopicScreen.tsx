import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';

import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectQuestionsByTopic } from '../redux/slices/questionsSlice';
import { selectTopicProgress } from '../redux/slices/progressSlice';
import { selectActiveSessionForTopic, clearSession } from '../redux/slices/sessionsSlice';
import { getTopicById } from '../data/topics';
import { getExamConfig } from '../data/examConfig';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Topic'>;

export function TopicScreen({ route, navigation }: Props) {
  const { topicId } = route.params;
  const dispatch = useAppDispatch();
  const topic = getTopicById(topicId);
  const questions = useAppSelector(selectQuestionsByTopic(topicId));
  const progress = useAppSelector(selectTopicProgress)[topicId];
  const isPremium = useAppSelector(selectIsPremium);
  const examCfg = topic ? getExamConfig(topicId) : null;
  const activeSession = useAppSelector(selectActiveSessionForTopic(topicId));

  // We only show "Resume" if the saved session has actually progressed past
  // Q1 OR has any answer revealed. A pristine "user opened the screen and
  // immediately left" session is not worth resuming.
  const canResume =
    !!activeSession &&
    (activeSession.index > 0 || activeSession.revealedByIndex.some(Boolean));

  useLayoutEffect(() => {
    if (topic) navigation.setOptions({ title: topic.name });
  }, [navigation, topic]);

  if (!topic) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Topic not found.</Text>
      </View>
    );
  }

  const attempted = progress?.attempted ?? 0;
  const correct = progress?.correct ?? 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  // Length picker. "all" maps to the full pool for this topic.
  // Free users are forced to 10 and the picker is locked.
  type Choice = 10 | 25 | 50 | 'all';
  const PRESETS: Choice[] = [10, 25, 50, 'all'];
  const [length, setLength] = useState<Choice>(10);

  const startPractice = () => {
    // Drop any unfinished session — the user is explicitly asking for a new
    // batch of questions.
    if (activeSession) dispatch(clearSession(topicId));
    const count =
      length === 'all' ? questions.length : Math.min(length, questions.length);
    navigation.navigate('Quiz', { topicId, mode: 'practice', count });
  };

  const handlePickLength = (choice: Choice) => {
    if (!isPremium && choice !== 10) {
      navigation.navigate('Paywall');
      return;
    }
    setLength(choice);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: topic.color }]}>
        <Text style={[typography.h1, styles.heroTitle]}>{topic.name}</Text>
        <Text style={[typography.body, styles.heroDesc]}>{topic.description}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Questions" value={String(questions.length)} />
        <Stat label="Attempted" value={`${attempted}/${questions.length}`} />
        <Stat label="Accuracy" value={attempted ? `${accuracy}%` : '—'} />
      </View>

      {attempted > 0 && (
        <View style={{ marginVertical: spacing.lg }}>
          <ProgressBar
            value={questions.length ? attempted / questions.length : 0}
            color={topic.color}
            height={8}
          />
        </View>
      )}

      <Text style={[typography.h2, styles.section]}>Practice</Text>
      <Text style={[typography.caption, styles.lengthLabel]}>HOW MANY QUESTIONS?</Text>
      <View style={styles.chipRow}>
        {PRESETS.map((choice) => {
          const isSelected = length === choice;
          const isLocked = !isPremium && choice !== 10;
          const label = choice === 'all' ? `All (${questions.length})` : String(choice);
          return (
            <Pressable
              key={String(choice)}
              onPress={() => handlePickLength(choice)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                isLocked && styles.chipLocked,
                pressed && { opacity: 0.7 },
              ]}
            >
              {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  isLocked && styles.chipTextLocked,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        title={canResume ? 'Start new practice' : 'Start Practice'}
        variant={canResume ? 'secondary' : 'primary'}
        onPress={startPractice}
      />
      {canResume && activeSession && (
        <Button
          title={`Resume — Q${activeSession.index + 1} of ${activeSession.questionIds.length}`}
          onPress={() =>
            navigation.navigate('Quiz', { topicId, mode: 'practice', resume: true })
          }
          style={{ marginTop: spacing.sm }}
        />
      )}
      {!isPremium && (
        <Text style={[typography.caption, styles.upsellNote]}>
          Free users get 10 questions per practice. Unlock Premium for longer sessions.
        </Text>
      )}

      <Text style={[typography.h2, styles.section]}>Mock Exam</Text>
      <View style={styles.examInfo}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {examCfg?.questionCount} questions • {examCfg?.timeLimitMinutes} minutes • {examCfg?.passMarkPercent}% to pass
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
          Real exam conditions: timer counts down, no answers shown until submit.
        </Text>
      </View>
      <Button
        title="Start Mock Exam"
        variant="secondary"
        onPress={() => {
          if (!isPremium) {
            navigation.navigate('Paywall');
            return;
          }
          navigation.navigate('Exam', { topicId });
        }}
      />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[typography.h2, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[typography.micro, { color: colors.textMuted }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: { color: colors.textInverse },
  heroDesc: { color: colors.textInverse, opacity: 0.92, marginTop: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  stat: { alignItems: 'center', flex: 1 },
  section: { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  lengthLabel: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  chipLocked: {
    backgroundColor: colors.surfaceAlt ?? colors.surface,
    opacity: 0.85,
  },
  chipText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  chipTextLocked: {
    color: colors.textMuted,
  },
  lockIcon: {
    fontSize: 11,
  },
  upsellNote: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  examInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
});

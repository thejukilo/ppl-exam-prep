import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';

import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { useAppSelector } from '../redux/store';
import { selectQuestionsByTopic } from '../redux/slices/questionsSlice';
import { selectTopicProgress } from '../redux/slices/progressSlice';
import { getTopicById } from '../data/topics';
import { getStudyGuideForTopic } from '../data/studyGuides';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Topic'>;

export function TopicScreen({ route, navigation }: Props) {
  const { topicId } = route.params;
  const topic = getTopicById(topicId);
  const questions = useAppSelector(selectQuestionsByTopic(topicId));
  const progress = useAppSelector(selectTopicProgress)[topicId];
  const guide = getStudyGuideForTopic(topicId);

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
      <Button
        title={attempted > 0 ? 'Continue Practice' : 'Start Practice'}
        onPress={() => navigation.navigate('Quiz', { topicId, mode: 'practice' })}
      />

      <Text style={[typography.h2, styles.section]}>Study Guide</Text>
      {guide ? (
        <Button
          title={`Open: ${guide.title}`}
          variant="secondary"
          onPress={() => navigation.navigate('StudyGuide', { topicId })}
        />
      ) : (
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Study guide coming soon.
        </Text>
      )}
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
});

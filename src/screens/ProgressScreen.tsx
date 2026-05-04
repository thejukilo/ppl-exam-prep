import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '../components/ProgressBar';
import { useAppSelector } from '../redux/store';
import { selectAllQuestions } from '../redux/slices/questionsSlice';
import { selectTopicProgress, selectBookmarks } from '../redux/slices/progressSlice';
import { TOPICS } from '../data/topics';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';

export function ProgressScreen() {
  const questions = useAppSelector(selectAllQuestions);
  const progress = useAppSelector(selectTopicProgress);
  const bookmarks = useAppSelector(selectBookmarks);

  const totals = useMemo(() => {
    let attempted = 0;
    let correct = 0;
    for (const t of TOPICS) {
      attempted += progress[t.id]?.attempted ?? 0;
      correct += progress[t.id]?.correct ?? 0;
    }
    return { attempted, correct, total: questions.length };
  }, [progress, questions]);

  const overallAccuracy = totals.attempted > 0
    ? Math.round((totals.correct / totals.attempted) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[typography.display, styles.title]}>Your Progress</Text>

        <View style={styles.summary}>
          <SummaryStat label="Answered" value={`${totals.attempted}`} sub={`of ${totals.total}`} />
          <SummaryStat label="Correct" value={`${totals.correct}`} sub={`${overallAccuracy}%`} />
          <SummaryStat label="Bookmarks" value={`${bookmarks.length}`} sub="" />
        </View>

        <Text style={[typography.h2, styles.section]}>By Subject</Text>

        {TOPICS.map((t) => {
          const total = questions.filter((q) => q.topicId === t.id).length;
          const p = progress[t.id];
          const attempted = p?.attempted ?? 0;
          const correct = p?.correct ?? 0;
          const acc = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
          return (
            <View key={t.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={[typography.bodyStrong, { color: colors.textPrimary }]}>{t.name}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {attempted}/{total} • {attempted > 0 ? `${acc}%` : '—'}
                </Text>
              </View>
              <View style={{ marginTop: spacing.xs }}>
                <ProgressBar value={total ? attempted / total : 0} color={t.color} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[typography.micro, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 2 }]}>{value}</Text>
      {sub ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{sub}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { color: colors.textPrimary, marginBottom: spacing.lg },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  section: { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  row: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

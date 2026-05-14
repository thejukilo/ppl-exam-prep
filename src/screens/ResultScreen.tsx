import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAppSelector } from '../redux/store';
import { selectQuestionById } from '../redux/slices/questionsSlice';
import { selectAttemptForQuestion } from '../redux/slices/progressSlice';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { getTopicById } from '../data/topics';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';
import { htmlToLines } from '../utils/htmlText';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ route, navigation }: Props) {
  const { topicId, correct, total, questionIds, isReview } = route.params;
  const topic = topicId ? getTopicById(topicId) : null;
  const isPremium = useAppSelector(selectIsPremium);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 75; // EASA pass mark

  const subtitle = isReview
    ? `${correct} of ${total} correct • Mistakes review`
    : `${correct} of ${total} correct${topic ? ` • ${topic.name}` : ''}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.scoreCard, { backgroundColor: passed ? colors.success : colors.error }]}>
        <Text style={[typography.micro, styles.scoreLabel]}>
          {passed ? 'PASSED' : 'KEEP PRACTISING'}
        </Text>
        <Text style={styles.bigScore}>{pct}%</Text>
        <Text style={[typography.body, styles.scoreSub]}>
          {subtitle}
        </Text>
      </View>

      <Text style={[typography.h2, styles.section]}>Review</Text>
      {questionIds.map((qid, i) => (
        <ReviewItem key={qid} qid={qid} index={i} />
      ))}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        {isReview ? (
          <Button
            title={isPremium ? 'Review More Mistakes' : 'Unlock all mistakes review'}
            onPress={() =>
              isPremium
                ? navigation.replace('Quiz', { mode: 'review' })
                : navigation.navigate('Paywall')
            }
          />
        ) : topicId ? (
          <Button
            title="Practise This Topic Again"
            onPress={() => navigation.replace('Quiz', { topicId, mode: 'practice' })}
          />
        ) : null}
        <Button
          title="Back to Topics"
          variant="secondary"
          onPress={() => navigation.popToTop()}
        />
      </View>
    </ScrollView>
  );
}

function ReviewItem({ qid, index }: { qid: string; index: number }) {
  const q = useAppSelector(selectQuestionById(qid));
  const attempt = useAppSelector(selectAttemptForQuestion(qid));
  if (!q || !attempt) return null;

  const lines = htmlToLines(q.text);
  const stem = lines[0] ?? q.text;

  return (
    <View
      style={[
        styles.reviewItem,
        { borderLeftColor: attempt.isCorrect ? colors.success : colors.error },
      ]}
    >
      <Text style={[typography.micro, { color: colors.textMuted }]}>
        QUESTION {index + 1} • {attempt.isCorrect ? 'CORRECT' : 'INCORRECT'}
      </Text>
      <Text style={[typography.body, { color: colors.textPrimary, marginTop: 4 }]} numberOfLines={3}>
        {stem}
      </Text>
      <View style={{ marginTop: spacing.sm }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Your answer: <Text style={{ fontWeight: '600' }}>{q.options[attempt.selectedAnswer]}</Text>
        </Text>
        {!attempt.isCorrect && (
          <Text style={[typography.caption, { color: colors.success, marginTop: 2 }]}>
            Correct: <Text style={{ fontWeight: '600' }}>{q.options[q.correctAnswer]}</Text>
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  scoreCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  scoreLabel: { color: colors.textInverse, opacity: 0.85 },
  bigScore: {
    color: colors.textInverse,
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 64,
    marginTop: spacing.xs,
  },
  scoreSub: { color: colors.textInverse, opacity: 0.92 },
  section: { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  reviewItem: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
});

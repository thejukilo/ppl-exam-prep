import React, { useMemo, useState, useLayoutEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { QuestionCard } from '../components/QuestionCard';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectQuestionsByTopic } from '../redux/slices/questionsSlice';
import {
  recordAttempt as recordAttemptAction,
  selectBookmarks,
  toggleBookmark,
} from '../redux/slices/progressSlice';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { useFreemium } from '../hooks/useFreemium';
import { recordAttempt as syncAttempt } from '../services/progressService';
import { Question } from '../types';
import { getTopicById } from '../data/topics';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

const PRACTICE_BATCH_SIZE = 10;

export function QuizScreen({ route, navigation }: Props) {
  const { topicId } = route.params;
  const dispatch = useAppDispatch();
  const allTopicQuestions = useAppSelector(selectQuestionsByTopic(topicId));
  const userId = useAppSelector((s) => s.auth.user?.id);
  const isPremium = useAppSelector(selectIsPremium);
  const bookmarks = useAppSelector(selectBookmarks);
  const freemium = useFreemium();
  const topic = getTopicById(topicId);

  // Build a stable randomised batch for this session.
  const batch = useMemo<Question[]>(() => {
    const shuffled = [...allTopicQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, PRACTICE_BATCH_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: topic?.name ?? 'Practice' });
  }, [navigation, topic]);

  if (batch.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>No questions available for this topic.</Text>
      </View>
    );
  }

  const current = batch[index];
  const isLast = index === batch.length - 1;
  const isBookmarked = bookmarks.includes(current.id);

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
  };

  const handleReveal = () => {
    if (selected === null) return;

    // Free-tier daily limit gate: only block if this question hasn't been
    // answered before (re-attempts don't consume quota).
    if (!isPremium && freemium.limitReached) {
      Alert.alert(
        'Daily limit reached',
        `Free users can answer ${freemium.dailyLimit} new questions per day. Go Premium for unlimited practice.`,
        [
          { text: 'Not now', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'Go Premium', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }

    const isCorrect = selected === current.correctAnswer;
    const attempt = {
      questionId: current.id,
      selectedAnswer: selected,
      isCorrect,
      answeredAt: Date.now(),
    };
    dispatch(recordAttemptAction(attempt));
    if (userId) syncAttempt(userId, attempt);

    if (isCorrect) setCorrectCount((c) => c + 1);
    setAnsweredIds((prev) => [...prev, current.id]);
    setRevealed(true);
  };

  const handleNext = () => {
    if (isLast) {
      navigation.replace('Result', {
        topicId,
        correct: correctCount,
        total: batch.length,
        questionIds: answeredIds,
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.micro, { color: colors.textMuted }]}>
            QUESTION {index + 1} / {batch.length}
          </Text>
          <View style={{ marginTop: spacing.xs }}>
            <ProgressBar value={(index + (revealed ? 1 : 0)) / batch.length} />
          </View>
        </View>
        <Button
          title={isBookmarked ? '★' : '☆'}
          variant="ghost"
          fullWidth={false}
          onPress={() => dispatch(toggleBookmark(current.id))}
          style={{ paddingHorizontal: spacing.md, marginLeft: spacing.md }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <QuestionCard
          question={current}
          selectedAnswer={selected}
          revealed={revealed}
          onSelect={handleSelect}
        />
      </ScrollView>

      <View style={styles.footer}>
        {!revealed ? (
          <Button
            title="Check Answer"
            onPress={handleReveal}
            disabled={selected === null}
          />
        ) : (
          <Button title={isLast ? 'See Results' : 'Next Question'} onPress={handleNext} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

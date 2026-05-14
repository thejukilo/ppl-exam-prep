import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { QuestionCard } from '../components/QuestionCard';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectQuestionsByTopic } from '../redux/slices/questionsSlice';
import { recordAttempt as recordAttemptAction } from '../redux/slices/progressSlice';
import { recordAttempt as syncAttempt } from '../services/progressService';
import { Question } from '../types';
import { getTopicById } from '../data/topics';
import { getExamConfig } from '../data/examConfig';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Exam'>;

export function ExamScreen({ route, navigation }: Props) {
  const { topicId } = route.params;
  const dispatch = useAppDispatch();
  const allTopicQuestions = useAppSelector(selectQuestionsByTopic(topicId));
  const userId = useAppSelector((s) => s.auth.user?.id);
  const topic = getTopicById(topicId);
  const examCfg = getExamConfig(topicId);

  // Build the exam paper once. Stable for the duration of the screen.
  // Build the exam paper ONCE at mount and never recompute. Same rationale
  // as QuizScreen: any reactive dep would silently swap questions out from
  // under the user mid-exam.
  const [paper] = useState<Question[]>(() => {
    const shuffled = [...allTopicQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, examCfg.questionCount);
  });

  // index -> selectedAnswer (null = unanswered)
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    Array(paper.length).fill(null)
  );
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(examCfg.timeLimitMinutes * 60);
  const startedAtRef = useRef(Date.now());

  // Header customization
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Exam: ${topic?.name ?? ''}`,
      headerLeft: () => null, // disable back gesture during exam
    });
  }, [navigation, topic]);

  // Block hardware back during exam (Android)
  useEffect(() => {
    if (submitted) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmAbandon();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const submit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    // Score and record attempts for the bookmarks/progress system
    let correct = 0;
    const questionIds: string[] = [];
    paper.forEach((q, i) => {
      const sel = answers[i];
      questionIds.push(q.id);
      if (sel !== null) {
        const isCorrect = sel === q.correctAnswer;
        if (isCorrect) correct++;
        const attempt = {
          questionId: q.id,
          selectedAnswer: sel,
          isCorrect,
          answeredAt: Date.now(),
        };
        dispatch(recordAttemptAction(attempt));
        if (userId) syncAttempt(userId, attempt);
      }
    });

    navigation.replace('Result', {
      topicId,
      correct,
      total: paper.length,
      questionIds,
    });
  }, [submitted, paper, answers, dispatch, userId, navigation, topicId]);

  // Countdown timer
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          // Use a ref to avoid stale-closure issues
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, submit]);

  if (paper.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>No questions available for this topic.</Text>
      </View>
    );
  }

  const current = paper[index];
  const isLast = index === paper.length - 1;
  const answeredCount = answers.filter((a) => a !== null).length;

  const confirmAbandon = () => {
    Alert.alert(
      'Leave exam?',
      'Your answers will not be saved and the exam will be abandoned.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            setSubmitted(true); // Stop the timer
            navigation.goBack();
          },
        },
      ]
    );
  };

  const confirmSubmit = () => {
    const unanswered = paper.length - answeredCount;
    Alert.alert(
      'Submit exam?',
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`
        : 'Are you sure you want to submit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submit },
      ]
    );
  };

  const handleSelect = (i: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = i;
      return next;
    });
  };

  const goPrev = () => {
    if (index > 0) setIndex(index - 1);
  };
  const goNext = () => {
    if (!isLast) setIndex(index + 1);
  };

  // Time formatting
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const timeStr = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const lowTime = secondsLeft < 60;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={confirmAbandon} hitSlop={8}>
          <Text style={[typography.bodyStrong, { color: colors.error }]}>Quit</Text>
        </Pressable>
        <View style={[styles.timerPill, lowTime && { backgroundColor: colors.error }]}>
          <Text style={styles.timerText}>{timeStr}</Text>
        </View>
        <Text style={[typography.micro, { color: colors.textMuted }]}>
          {answeredCount}/{paper.length}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <ProgressBar value={(index + 1) / paper.length} />
        <Text style={[typography.micro, { color: colors.textMuted, marginTop: 4 }]}>
          QUESTION {index + 1} OF {paper.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <QuestionCard
          question={current}
          selectedAnswer={answers[index]}
          revealed={false}
          onSelect={handleSelect}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navRow}>
          <Button
            title="← Previous"
            variant="secondary"
            onPress={goPrev}
            disabled={index === 0}
            fullWidth={false}
            style={{ flex: 1 }}
          />
          {isLast ? (
            <Button
              title="Submit Exam"
              onPress={confirmSubmit}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              title="Next →"
              onPress={goNext}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          )}
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.lg,
  },
  timerText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  progressBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  navRow: { flexDirection: 'row', gap: spacing.sm },
});

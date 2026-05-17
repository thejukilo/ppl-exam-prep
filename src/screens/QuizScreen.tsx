import React, { useEffect, useState, useLayoutEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { QuestionCard } from '../components/QuestionCard';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

import { useAppDispatch, useAppSelector } from '../redux/store';
import { selectAllQuestions, selectQuestionsByTopic } from '../redux/slices/questionsSlice';
import {
  recordAttempt as recordAttemptAction,
  selectAttemptForQuestion,
  selectBookmarks,
  selectWrongAnsweredIds,
  toggleBookmark,
} from '../redux/slices/progressSlice';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import {
  saveSession,
  clearSession,
  selectActiveSessionForTopic,
  ActiveSession,
} from '../redux/slices/sessionsSlice';
import { useFreemium } from '../hooks/useFreemium';
import { recordAttempt as syncAttempt } from '../services/progressService';
import { Question } from '../types';
import { getTopicById } from '../data/topics';
import { FREEMIUM } from '../config/freemium';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

const PRACTICE_BATCH_SIZE = 10;
const REVIEW_FREE_PREVIEW_SIZE = 5;
const REVIEW_DEFAULT_SIZE = 10;

export function QuizScreen({ route, navigation }: Props) {
  const { topicId, startQuestionId, count: requestedCount, mode = 'practice', resume } = route.params;
  const dispatch = useAppDispatch();
  const isReview = mode === 'review';

  const allQuestions = useAppSelector(selectAllQuestions);
  const topicQuestions = useAppSelector(selectQuestionsByTopic(topicId ?? ('' as any)));
  const wrongIds = useAppSelector(selectWrongAnsweredIds);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const isPremium = useAppSelector(selectIsPremium);
  const bookmarks = useAppSelector(selectBookmarks);
  const freemium = useFreemium(topicId ?? null);
  const topic = topicId ? getTopicById(topicId) : null;

  // Look up a previously-saved session for this topic, only relevant when
  // resuming. Read at mount only — we don't react to it after that.
  const savedSession = useAppSelector(
    topicId ? selectActiveSessionForTopic(topicId) : () => undefined
  );

  // Build the session's batch ONCE at mount and never recompute it.
  // Recomputing mid-session would silently swap the questions out from under
  // the user (e.g. when a wrong answer is recorded, wrongIds changes, and
  // any dependency on wrongIds would reshuffle everything).
  //
  // If resume === true and we have a saved session for this topic, restore it.
  // Otherwise build a fresh batch.
  const initialState = useState(() => {
    // Resume path
    if (resume && savedSession && !isReview) {
      const byId = new Map(allQuestions.map((q) => [q.id, q]));
      const restored = savedSession.questionIds
        .map((id) => byId.get(id))
        .filter((q): q is Question => !!q);
      // If for any reason we couldn't reconstruct the batch (e.g. questions
      // deleted from the DB), fall through to a fresh batch.
      if (restored.length === savedSession.questionIds.length) {
        return {
          batch: restored,
          index: savedSession.index,
          selectedByIndex: savedSession.selectedByIndex,
          revealedByIndex: savedSession.revealedByIndex,
        };
      }
    }

    // Fresh batch path
    let pool: Question[];
    if (isReview) {
      const byId = new Map(allQuestions.map((q) => [q.id, q]));
      pool = wrongIds.map((id) => byId.get(id)).filter((q): q is Question => !!q);
    } else {
      pool = [...topicQuestions].sort(() => Math.random() - 0.5);
    }

    let cap: number;
    if (isReview) {
      cap = isPremium
        ? Math.min(requestedCount ?? REVIEW_DEFAULT_SIZE, pool.length)
        : Math.min(REVIEW_FREE_PREVIEW_SIZE, pool.length);
    } else {
      cap = isPremium
        ? Math.min(requestedCount ?? PRACTICE_BATCH_SIZE, pool.length)
        : PRACTICE_BATCH_SIZE;
    }

    let picked = pool.slice(0, cap);
    if (startQuestionId) {
      const target = allQuestions.find((q) => q.id === startQuestionId);
      if (target) {
        picked = picked.filter((q) => q.id !== target.id);
        picked.unshift(target);
      }
    }

    return {
      batch: picked,
      index: 0,
      selectedByIndex: Array(picked.length).fill(null) as (number | null)[],
      revealedByIndex: Array(picked.length).fill(false) as boolean[],
    };
  })[0];

  const [batch] = useState(initialState.batch);
  const [index, setIndex] = useState(initialState.index);
  const [selectedByIndex, setSelectedByIndex] = useState<(number | null)[]>(
    initialState.selectedByIndex
  );
  const [revealedByIndex, setRevealedByIndex] = useState<boolean[]>(
    initialState.revealedByIndex
  );
  // Recompute correctCount from restored state — the user got X right earlier
  // and we need that for the final score.
  const [correctCount, setCorrectCount] = useState(() => {
    let n = 0;
    initialState.batch.forEach((q, i) => {
      if (
        initialState.revealedByIndex[i] &&
        initialState.selectedByIndex[i] === q.correctAnswer
      ) {
        n++;
      }
    });
    return n;
  });
  const [answeredIds, setAnsweredIds] = useState<string[]>(() =>
    initialState.batch
      .filter((_, i) => initialState.revealedByIndex[i])
      .map((q) => q.id)
  );

  useLayoutEffect(() => {
    let title = 'Practice';
    if (isReview) title = 'Review Mistakes';
    else if (topic?.name) title = topic.name;
    navigation.setOptions({ title });
  }, [navigation, topic, isReview]);

  // Persist the session on every state change so the user can resume later.
  // Only practice mode sessions are persisted — review mode is ephemeral by
  // design (the wrong-answer pool is volatile), and exam mode lives in
  // ExamScreen.
  //
  // We skip the very first render so the saved session isn't immediately
  // overwritten by a fresh "no progress yet" state when the user JUST started.
  // Once they've revealed at least one answer or moved past Q1, we save.
  useEffect(() => {
    if (!topicId || isReview) return;
    const anyRevealed = revealedByIndex.some(Boolean);
    if (!anyRevealed && index === 0) return; // pristine state — no need to save
    const session: ActiveSession = {
      topicId,
      questionIds: batch.map((q) => q.id),
      selectedByIndex,
      revealedByIndex,
      index,
      updatedAt: Date.now(),
      mode: 'practice',
    };
    dispatch(saveSession(session));
  }, [
    topicId,
    isReview,
    index,
    selectedByIndex,
    revealedByIndex,
    batch,
    dispatch,
  ]);

  if (batch.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>
          {isReview
            ? "You haven't got any wrong answers yet — answer some questions first."
            : 'No questions available for this topic.'}
        </Text>
      </View>
    );
  }

  const current = batch[index];
  const selected = selectedByIndex[index];
  const revealed = revealedByIndex[index];
  const isLast = index === batch.length - 1;
  const isFirst = index === 0;
  const isBookmarked = bookmarks.includes(current.id);
  // True if user has previously answered this question (re-attempts are free).
  const isReattempt = useAppSelector(selectAttemptForQuestion(current.id)) !== undefined;

  const handleSelect = (i: number) => {
    if (revealed) return; // Locked in — no changes after Check Answer
    setSelectedByIndex((prev) => {
      const next = [...prev];
      next[index] = i;
      return next;
    });
  };

  const handleReveal = () => {
    if (selected === null) return;

    // Free-tier lifetime limit gate: re-attempts of already-answered questions
    // are always free; only block when the user is about to consume a new slot.
    if (!isPremium && !isReattempt && freemium.limitReached) {
    Alert.alert(
        'Topic limit reached',
        `You've used all ${freemium.perTopicLimit} of your free questions for this topic. Unlock the full question bank to keep going (${FREEMIUM.pricing.lifetime.display}, one-time, lifetime access).`,
        [
          { text: 'Not now', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'Unlock', onPress: () => navigation.navigate('Paywall') },
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
    setRevealedByIndex((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleNext = () => {
    // If we're going forward THROUGH a question we already revealed (because the
    // user navigated back, and is now navigating forward again), just advance —
    // don't try to re-record anything.
    if (isLast) {
      // Only end the session if the last question has actually been answered.
      if (revealed) {
        // The session is complete — clear the saved state so "Resume" doesn't
        // offer this finished session next time.
        if (topicId && !isReview) dispatch(clearSession(topicId));
        navigation.replace('Result', {
          topicId,
          correct: correctCount,
          total: batch.length,
          questionIds: answeredIds,
          isReview,
        });
      }
      return;
    }
    setIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (isFirst) return;
    setIndex((i) => i - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.micro, { color: colors.textMuted }]}>
            QUESTION {index + 1} / {batch.length}
          </Text>
          <View style={{ marginTop: spacing.xs }}>
            <ProgressBar value={revealedByIndex.filter(Boolean).length / batch.length} />
          </View>
        </View>
        <Pressable
          onPress={() => dispatch(toggleBookmark(current.id))}
          hitSlop={8}
          style={({ pressed }) => [
            styles.bookmarkBtn,
            isBookmarked && styles.bookmarkBtnActive,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={[
              styles.bookmarkStar,
              { color: isBookmarked ? colors.primary : colors.textSecondary },
            ]}
          >
            {isBookmarked ? '★' : '☆'}
          </Text>
          <Text
            style={[
              styles.bookmarkLabel,
              { color: isBookmarked ? colors.primary : colors.textSecondary },
            ]}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
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
        <View style={styles.footerRow}>
          <Button
            title="← Previous"
            variant="secondary"
            onPress={handlePrev}
            disabled={isFirst}
            fullWidth={false}
            style={{ flex: 1 }}
          />
          {!revealed ? (
            <Button
              title="Check Answer"
              onPress={handleReveal}
              disabled={selected === null}
              fullWidth={false}
              style={{ flex: 2 }}
            />
          ) : (
            <Button
              title={isLast ? 'See Results' : 'Next →'}
              onPress={handleNext}
              fullWidth={false}
              style={{ flex: 2 }}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginLeft: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  bookmarkBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15', // ~8% alpha tint
  },
  bookmarkStar: { fontSize: 18, marginRight: 4, lineHeight: 18 },
  bookmarkLabel: { fontSize: 13, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
});

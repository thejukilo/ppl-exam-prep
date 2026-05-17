import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  selectBookmarks,
  toggleBookmark,
  selectAttemptForQuestion,
} from '../redux/slices/progressSlice';
import { selectQuestionById } from '../redux/slices/questionsSlice';
import { getTopicById } from '../data/topics';
import { Question } from '../types';
import { htmlToLines } from '../utils/htmlText';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookmarks'>;

export function BookmarksScreen({ navigation }: Props) {
  const bookmarkIds = useAppSelector(selectBookmarks);

  if (bookmarkIds.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>★</Text>
          <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
            No bookmarks yet
          </Text>
          <Text style={[typography.body, styles.emptyDesc]}>
            While practising, tap the bookmark button on any question you want to revisit.
            They'll all appear here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[typography.display, styles.title]}>Bookmarks</Text>
        <Text style={[typography.body, styles.subtitle]}>
          {bookmarkIds.length} question{bookmarkIds.length === 1 ? '' : 's'} saved for later
        </Text>

        {bookmarkIds.map((id) => (
          <BookmarkRow key={id} questionId={id} navigation={navigation} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

interface RowProps {
  questionId: string;
  navigation: Props['navigation'];
}

function BookmarkRow({ questionId, navigation }: RowProps) {
  const dispatch = useAppDispatch();
  const question = useAppSelector(selectQuestionById(questionId));
  const attempt = useAppSelector(selectAttemptForQuestion(questionId));

  if (!question) return null;

  const topic = getTopicById(question.topicId);
  const stem = htmlToLines(question.text)[0] ?? question.text;

  const status = attempt
    ? attempt.isCorrect
      ? { label: 'CORRECT LAST TIME', color: colors.success }
      : { label: 'INCORRECT LAST TIME', color: colors.error }
    : { label: 'NOT ATTEMPTED', color: colors.textMuted };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() =>
          navigation.navigate('Quiz', {
            topicId: question.topicId,
            mode: 'practice',
            startQuestionId: question.id,
          })
        }
        style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.rowHeader}>
          <View style={[styles.topicChip, { backgroundColor: topic?.color ?? colors.primary }]}>
            <Text style={styles.topicChipText}>{topic?.name ?? 'Topic'}</Text>
          </View>
          <Text style={[typography.micro, { color: status.color, fontWeight: '700' }]}>
            {status.label}
          </Text>
        </View>
        <Text style={[typography.body, styles.stem]} numberOfLines={3}>
          {stem}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => dispatch(toggleBookmark(questionId))}
        style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
        hitSlop={8}
      >
        <Text style={styles.removeBtnText}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    emptyEmoji: {
    fontSize: 56,
    lineHeight: 72,
    marginBottom: spacing.md,
    color: colors.primary,
    includeFontPadding: false,
    textAlign: 'center',
  },
  emptyDesc: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  row: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topicChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  topicChipText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stem: { color: colors.textPrimary },
  removeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  removeBtnText: { color: colors.error, fontSize: 13, fontWeight: '600' },
});

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuestionAttempt, TopicId, TopicProgress } from '../../types';

interface ProgressState {
  /** Most recent attempt per question — id -> attempt */
  attemptsByQuestion: Record<string, QuestionAttempt>;
  /** Bookmarked question IDs */
  bookmarks: string[];
}

const initialState: ProgressState = {
  attemptsByQuestion: {},
  bookmarks: [],
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    recordAttempt: (state, action: PayloadAction<QuestionAttempt>) => {
      const a = action.payload;
      // Just record the most recent attempt. Free-tier counting is derived from
      // the size of attemptsByQuestion (see selectors below) — no separate
      // counter needed, no daily reset, no exploit.
      state.attemptsByQuestion[a.questionId] = a;
    },
    toggleBookmark: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const i = state.bookmarks.indexOf(id);
      if (i === -1) state.bookmarks.push(id);
      else state.bookmarks.splice(i, 1);
    },
    hydrate: (state, action: PayloadAction<Partial<ProgressState>>) => {
      Object.assign(state, action.payload);
    },
    reset: () => initialState,
  },
});

export const { recordAttempt, toggleBookmark, hydrate, reset } = progressSlice.actions;
export default progressSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

import type { RootState } from '../store';
import { selectAllQuestions } from './questionsSlice';

export const selectAttemptForQuestion =
  (id: string) =>
  (s: RootState): QuestionAttempt | undefined =>
    s.progress.attemptsByQuestion[id];

export const selectBookmarks = (s: RootState) => s.progress.bookmarks;

/**
 * How many distinct questions the user has ever answered.
 * This is the number that counts against the free-tier lifetime quota.
 */
export const selectUniqueAnsweredCount = (s: RootState): number =>
  Object.keys(s.progress.attemptsByQuestion).length;

/**
 * Question IDs the user got wrong on their MOST RECENT attempt. If they
 * later answered correctly, the question is no longer in this set.
 *
 * Sorted most-recently-wrong first.
 */
export const selectWrongAnsweredIds = (s: RootState): string[] => {
  const wrong = Object.values(s.progress.attemptsByQuestion).filter(
    (a) => !a.isCorrect
  );
  return wrong
    .sort((a, b) => b.answeredAt - a.answeredAt)
    .map((a) => a.questionId);
};

export const selectTopicProgress = (s: RootState): Record<TopicId, TopicProgress> => {
  const out: Partial<Record<TopicId, TopicProgress>> = {};
  const questions = selectAllQuestions(s);
  for (const q of questions) {
    const a = s.progress.attemptsByQuestion[q.id];
    const cur = out[q.topicId] ?? {
      topicId: q.topicId,
      attempted: 0,
      correct: 0,
      lastAttemptedAt: null,
    };
    if (a) {
      cur.attempted += 1;
      if (a.isCorrect) cur.correct += 1;
      if (!cur.lastAttemptedAt || a.answeredAt > cur.lastAttemptedAt) {
        cur.lastAttemptedAt = a.answeredAt;
      }
    }
    out[q.topicId] = cur;
  }
  return out as Record<TopicId, TopicProgress>;
};

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuestionAttempt, TopicId, TopicProgress } from '../../types';

interface ProgressState {
  /** Most recent attempt per question — id -> attempt */
  attemptsByQuestion: Record<string, QuestionAttempt>;
  /** Bookmarked question IDs */
  bookmarks: string[];
  /** Local-time YYYY-MM-DD -> count of questions answered that day */
  dailyCounts: Record<string, number>;
}

const initialState: ProgressState = {
  attemptsByQuestion: {},
  bookmarks: [],
  dailyCounts: {},
};

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    recordAttempt: (state, action: PayloadAction<QuestionAttempt>) => {
      const a = action.payload;
      const prev = state.attemptsByQuestion[a.questionId];
      state.attemptsByQuestion[a.questionId] = a;
      // Only count *new* questions toward the daily limit; re-attempts are free.
      if (!prev) {
        const k = todayKey();
        state.dailyCounts[k] = (state.dailyCounts[k] ?? 0) + 1;
      }
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

export const selectQuestionsAnsweredToday = (s: RootState): number =>
  s.progress.dailyCounts[todayKey()] ?? 0;

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

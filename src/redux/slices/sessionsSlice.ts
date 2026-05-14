import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TopicId } from '../../types';

/**
 * An in-progress practice session that the user can resume.
 *
 * Stored as: questionIds (the batch order), selectedByIndex, revealedByIndex,
 * the index they were on, and a timestamp. We do NOT store the full Question
 * objects — only IDs — to keep storage small and avoid stale snapshots if
 * question content changes.
 */
export interface ActiveSession {
  topicId: TopicId;
  /** The fixed batch (question IDs in display order). */
  questionIds: string[];
  /** Selected answer per index, or null if not chosen. */
  selectedByIndex: (number | null)[];
  /** Whether each question has been revealed/locked. */
  revealedByIndex: boolean[];
  /** Current question index. */
  index: number;
  /** When the session was last touched (ms epoch). For staleness checks. */
  updatedAt: number;
  /** Source mode — for now only practice. Review/exam don't persist. */
  mode: 'practice';
}

interface SessionsState {
  /** topicId -> active session for that topic */
  byTopic: Partial<Record<TopicId, ActiveSession>>;
}

const initialState: SessionsState = {
  byTopic: {},
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    saveSession: (state, action: PayloadAction<ActiveSession>) => {
      state.byTopic[action.payload.topicId] = action.payload;
    },
    clearSession: (state, action: PayloadAction<TopicId>) => {
      delete state.byTopic[action.payload];
    },
    hydrateSessions: (state, action: PayloadAction<Partial<SessionsState>>) => {
      Object.assign(state, action.payload);
    },
    resetSessions: () => initialState,
  },
});

export const { saveSession, clearSession, hydrateSessions, resetSessions } =
  sessionsSlice.actions;
export default sessionsSlice.reducer;

import type { RootState } from '../store';

export const selectActiveSessionForTopic =
  (topicId: TopicId) =>
  (s: RootState): ActiveSession | undefined =>
    s.sessions.byTopic[topicId];

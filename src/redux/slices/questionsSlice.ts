import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Question, TopicId } from '../../types';

interface QuestionsState {
  byId: Record<string, Question>;
  allIds: string[];
  loading: boolean;
  error: string | null;
}

const initialState: QuestionsState = {
  byId: {},
  allIds: [],
  loading: false,
  error: null,
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    questionsLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    questionsLoaded: (state, action: PayloadAction<Question[]>) => {
      state.byId = {};
      state.allIds = [];
      for (const q of action.payload) {
        state.byId[q.id] = q;
        state.allIds.push(q.id);
      }
      state.loading = false;
    },
    questionsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { questionsLoading, questionsLoaded, questionsError } = questionsSlice.actions;
export default questionsSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

import type { RootState } from '../store';

export const selectAllQuestions = (s: RootState): Question[] =>
  s.questions.allIds.map((id) => s.questions.byId[id]);

export const selectQuestionsByTopic =
  (topicId: TopicId) =>
  (s: RootState): Question[] =>
    selectAllQuestions(s).filter((q) => q.topicId === topicId);

export const selectQuestionById =
  (id: string) =>
  (s: RootState): Question | undefined =>
    s.questions.byId[id];

export const selectQuestionsLoading = (s: RootState) => s.questions.loading;
export const selectQuestionsError = (s: RootState) => s.questions.error;

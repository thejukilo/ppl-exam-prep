import { supabase } from './supabase';
import { QuestionAttempt } from '../types';

/**
 * Progress sync.
 *
 * The Redux progressSlice is the source of truth on-device. This service
 * pushes attempts to the `attempts` table in Supabase so the user keeps
 * their progress when reinstalling or switching devices.
 *
 * Writes are fire-and-forget — failures are logged but do not block UI.
 */

export async function recordAttempt(userId: string, attempt: QuestionAttempt): Promise<void> {
  try {
    await supabase.from('attempts').insert({
      user_id: userId,
      question_id: attempt.questionId,
      selected_answer: attempt.selectedAnswer,
      is_correct: attempt.isCorrect,
      answered_at: new Date(attempt.answeredAt).toISOString(),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[progress] failed to record attempt', e);
  }
}

export async function fetchAttempts(userId: string): Promise<QuestionAttempt[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('question_id, selected_answer, is_correct, answered_at')
    .eq('user_id', userId);

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[progress] failed to fetch attempts', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    questionId: r.question_id,
    selectedAnswer: r.selected_answer,
    isCorrect: r.is_correct,
    answeredAt: new Date(r.answered_at).getTime(),
  }));
}

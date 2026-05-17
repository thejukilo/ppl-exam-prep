import { useAppSelector } from '../redux/store';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { selectAllQuestions } from '../redux/slices/questionsSlice';
import { FREEMIUM } from '../config/freemium';
import type { RootState } from '../redux/store';
import type { TopicId } from '../types';

export interface FreemiumStatus {
  isPremium: boolean;
  /** Distinct questions the user has answered in this topic. */
  answeredInTopic: number;
  /** Free-tier quota per topic. */
  perTopicLimit: number;
  /** How many free questions the user has left in this topic. Infinity for premium. */
  remaining: number;
  /** True when the free user has used up their quota in this topic. */
  limitReached: boolean;
}

/**
 * Returns freemium status for a specific topic.
 * Each topic has its own quota (FREEMIUM.freeQuestionsPerTopic).
 *
 * If topicId is null/undefined, returns a "premium-equivalent" status
 * (no limit) — used for non-topic-specific contexts.
 */
export function useFreemium(topicId?: TopicId | null): FreemiumStatus {
  const isPremium = useAppSelector(selectIsPremium);
  const answeredInTopic = useAppSelector((s) =>
    topicId ? selectAnsweredInTopic(s, topicId) : 0
  );
  const perTopicLimit = FREEMIUM.freeQuestionsPerTopic;

  // No topic = no gate (e.g. reviewing mistakes, browsing stats)
  if (!topicId) {
    return {
      isPremium,
      answeredInTopic: 0,
      perTopicLimit,
      remaining: Infinity,
      limitReached: false,
    };
  }

  const remaining = isPremium
    ? Infinity
    : Math.max(0, perTopicLimit - answeredInTopic);

  return {
    isPremium,
    answeredInTopic,
    perTopicLimit,
    remaining,
    limitReached: !isPremium && answeredInTopic >= perTopicLimit,
  };
}

/**
 * Selector: count of distinct questions the user has answered in a given topic.
 * Uses the questions registry to look up topic for each attempt.
 */
function selectAnsweredInTopic(state: RootState, topicId: TopicId): number {
  const questions = selectAllQuestions(state);
  const attempts = state.progress.attemptsByQuestion;
  let count = 0;
  for (const q of questions) {
    if (q.topicId === topicId && attempts[q.id]) {
      count++;
    }
  }
  return count;
}

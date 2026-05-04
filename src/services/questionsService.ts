import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question, TopicId } from '../types';
import { TOPIC_NAME_TO_ID } from '../data/topics';
import { supabase } from './supabase';

const CACHE_KEY = 'questions_cache_v1';
const CACHE_TIMESTAMP_KEY = 'questions_cache_ts_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SupabaseQuestionRow {
  id: string;
  topic: string;            // Original topic name from data.json
  text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  attachment_url: string | null;
}

function rowToQuestion(row: SupabaseQuestionRow): Question | null {
  const topicId = TOPIC_NAME_TO_ID[row.topic];
  if (!topicId) {
    // eslint-disable-next-line no-console
    console.warn(`[questions] Unknown topic: ${row.topic}`);
    return null;
  }
  return {
    id: row.id,
    topicId,
    text: row.text,
    options: row.options,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    attachmentUrl: row.attachment_url,
  };
}

/**
 * Fetch all questions, with a 24h on-device cache.
 *
 * The 893-question payload is roughly 300 KB — small enough to keep in
 * memory and on disk. If the bank grows past a few thousand, switch to
 * lazy loading by topic.
 */
export async function fetchAllQuestions(forceRefresh = false): Promise<Question[]> {
  if (!forceRefresh) {
    const cached = await readCache();
    if (cached) return cached;
  }

  const { data, error } = await supabase
    .from('questions')
    .select('id, topic, text, options, correct_answer, explanation, attachment_url');

  if (error) {
    // Fall back to whatever cache we have, even if stale
    const stale = await readCache(true);
    if (stale) return stale;
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  const questions: Question[] = ((data ?? []) as SupabaseQuestionRow[])
    .map(rowToQuestion)
    .filter((q): q is Question => q !== null);

  await writeCache(questions);
  return questions;
}

export async function fetchQuestionsByTopic(topicId: TopicId): Promise<Question[]> {
  const all = await fetchAllQuestions();
  return all.filter((q) => q.topicId === topicId);
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function readCache(allowStale = false): Promise<Question[] | null> {
  try {
    const [json, tsRaw] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY),
      AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
    ]);
    if (!json) return null;
    if (!allowStale) {
      const ts = tsRaw ? parseInt(tsRaw, 10) : 0;
      if (Date.now() - ts > CACHE_TTL_MS) return null;
    }
    return JSON.parse(json) as Question[];
  } catch {
    return null;
  }
}

async function writeCache(qs: Question[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(qs));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // Cache write failures are non-fatal
  }
}

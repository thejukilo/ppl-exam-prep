import { TopicId } from '../types';

/**
 * EASA PPL(A) theoretical exam configuration per subject.
 *
 * These reflect the typical exam length and time limits used by EASA member
 * states (ratios are similar; some states tweak by ±2 questions or ±5 min).
 * Pass mark is 75% across all subjects.
 *
 * If you discover your national authority uses different numbers, change here
 * — every Mock Exam reads from this file.
 */

export interface ExamConfig {
  /** How many questions in a real exam paper for this subject. */
  questionCount: number;
  /** Time limit in minutes. */
  timeLimitMinutes: number;
  /** Pass mark as a percentage. EASA standard is 75 across the board. */
  passMarkPercent: number;
}

export const EXAM_CONFIG: Record<TopicId, ExamConfig> = {
  air_law:                     { questionCount: 16, timeLimitMinutes: 30, passMarkPercent: 75 },
  meteorology:                 { questionCount: 20, timeLimitMinutes: 60, passMarkPercent: 75 },
  navigation:                  { questionCount: 20, timeLimitMinutes: 60, passMarkPercent: 75 },
  aircraft_general_knowledge:  { questionCount: 20, timeLimitMinutes: 35, passMarkPercent: 75 },
  principles_of_flight:        { questionCount: 16, timeLimitMinutes: 30, passMarkPercent: 75 },
  flight_performance_planning: { questionCount: 16, timeLimitMinutes: 60, passMarkPercent: 75 },
  communication:               { questionCount: 16, timeLimitMinutes: 20, passMarkPercent: 75 },
  operational_procedures:      { questionCount: 12, timeLimitMinutes: 30, passMarkPercent: 75 },
  human_performance:           { questionCount: 12, timeLimitMinutes: 30, passMarkPercent: 75 },
};

export function getExamConfig(topicId: TopicId): ExamConfig {
  return EXAM_CONFIG[topicId];
}

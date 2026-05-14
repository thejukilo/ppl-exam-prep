// ============================================================================
// Core domain types
// ============================================================================

export type TopicId =
  | 'air_law'
  | 'meteorology'
  | 'navigation'
  | 'aircraft_general_knowledge'
  | 'principles_of_flight'
  | 'flight_performance_planning'
  | 'communication'
  | 'operational_procedures'
  | 'human_performance';

export interface Topic {
  id: TopicId;
  name: string;          // Display name, e.g. "Air Law"
  description: string;
  icon: string;          // Lucide / Ionicons name
  color: string;         // Hex
  questionCount: number; // Filled at runtime from question data
  isFree: boolean;       // For "1 free topic" gating, not used by default
}

export interface Question {
  id: string;            // Stable UUID from Supabase
  topicId: TopicId;
  text: string;          // May contain <br /> HTML — render via htmlText util
  options: string[];     // 2..n options, plain text
  correctAnswer: number; // Index into options[]
  explanation: string | null; // Plain text or markdown; null = no explanation yet
  attachmentUrl: string | null; // Supabase Storage public URL for charts/diagrams
}

// ============================================================================
// User progress
// ============================================================================

export interface QuestionAttempt {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  answeredAt: number;     // ms epoch
}

export interface TopicProgress {
  topicId: TopicId;
  attempted: number;
  correct: number;
  lastAttemptedAt: number | null;
}

// ============================================================================
// Subscription
// ============================================================================

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionState {
  tier: SubscriptionTier;
  premiumSince: number | null;
  expiresAt: number | null; // null = lifetime / not applicable
}

// ============================================================================
// Auth
// ============================================================================

export interface AppUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

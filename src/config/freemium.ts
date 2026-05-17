/**
 * Freemium config — central place to tune the free/paid model.
 *
 * Change values here rather than scattering magic numbers across screens.
 */

export const FREEMIUM = {
  // Per-topic quota of NEW questions a free user can answer in each topic.
  // Re-attempts of already-answered questions don't count against this.
  // Each topic has its own counter, so users can sample every subject.
  freeQuestionsPerTopic: 10,

  // Free users can attempt all topics by default. Set to true to lock all
  // topics except those marked `isFree: true` in topics.ts.
  lockNonFreeTopicsForFree: false,

  // Single one-time purchase. No subscriptions.
  // Display string is shown in the paywall; actual price is fetched from the
  // store at runtime (see subscriptionService).
  pricing: {
    lifetime: {
      display: '€19.99',
      productId: 'ppl_premium_lifetime',
      label: 'Lifetime access',
    },
  },
} as const;

export const APP_CONFIG = {
  appName: 'PPL Exam Prep',
  supportEmail: 'support@jukilo.com',
  privacyPolicyUrl: 'https://jukilo.com/privacy',
  termsUrl: 'https://jukilo.com/terms',
} as const;

/**
 * Freemium config — central place to tune the free/paid model.
 *
 * Change values here rather than scattering magic numbers across screens.
 */

export const FREEMIUM = {
  // How many questions a free user can answer per calendar day (local time)
  freeDailyQuestionLimit: 20,

  // If true, the first section of every study guide is visible to free users
  freeStudyGuidePreview: true,

  // Free users can attempt all topics by default. Set to true to lock all
  // topics except those marked `isFree: true` in topics.ts.
  lockNonFreeTopicsForFree: false,

  // Premium pricing (display only — actual prices come from the store)
  pricing: {
    monthly: { display: '€4.99/mo', productId: 'ppl_premium_monthly' },
    yearly:  { display: '€34.99/yr', productId: 'ppl_premium_yearly', badge: 'Save 41%' },
    lifetime:{ display: '€79.99',    productId: 'ppl_premium_lifetime' },
  },

  // Trial: free users get this many days of premium on first launch (set to 0 to disable)
  trialDays: 0,
} as const;

export const APP_CONFIG = {
  appName: 'PPL Exam Prep',
  supportEmail: 'support@example.com',
  privacyPolicyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
} as const;

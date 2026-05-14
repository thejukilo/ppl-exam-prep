import { useAppSelector } from '../redux/store';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { selectUniqueAnsweredCount } from '../redux/slices/progressSlice';
import { FREEMIUM } from '../config/freemium';

export interface FreemiumStatus {
  isPremium: boolean;
  /** Distinct questions the user has ever answered. */
  answeredEver: number;
  /** Total free-tier quota (across the user's lifetime). */
  lifetimeLimit: number;
  /** How many free questions the user has left. Infinity for premium. */
  remaining: number;
  /** True when the free user has used up their lifetime quota. */
  limitReached: boolean;
}

export function useFreemium(): FreemiumStatus {
  const isPremium = useAppSelector(selectIsPremium);
  const answeredEver = useAppSelector(selectUniqueAnsweredCount);
  const lifetimeLimit = FREEMIUM.freeLifetimeQuestionLimit;
  const remaining = isPremium ? Infinity : Math.max(0, lifetimeLimit - answeredEver);
  return {
    isPremium,
    answeredEver,
    lifetimeLimit,
    remaining,
    limitReached: !isPremium && answeredEver >= lifetimeLimit,
  };
}

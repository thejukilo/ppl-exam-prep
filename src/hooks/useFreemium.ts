import { useAppSelector } from '../redux/store';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { selectQuestionsAnsweredToday } from '../redux/slices/progressSlice';
import { FREEMIUM } from '../config/freemium';

export interface FreemiumStatus {
  isPremium: boolean;
  answeredToday: number;
  dailyLimit: number;
  remaining: number;
  limitReached: boolean;
}

export function useFreemium(): FreemiumStatus {
  const isPremium = useAppSelector(selectIsPremium);
  const answeredToday = useAppSelector(selectQuestionsAnsweredToday);
  const dailyLimit = FREEMIUM.freeDailyQuestionLimit;
  const remaining = isPremium ? Infinity : Math.max(0, dailyLimit - answeredToday);
  return {
    isPremium,
    answeredToday,
    dailyLimit,
    remaining,
    limitReached: !isPremium && answeredToday >= dailyLimit,
  };
}

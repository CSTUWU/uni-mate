import type { GpaStats } from "../types/gpa";
import { calculateCombinedCgpa } from "../utils/gpaCalculator";
import { usePersistedState } from "./usePersistedState";

const LS_PRIOR = "unimate_prior_gpa_v2";

export interface PriorGpa {
  enabled: boolean;
  cgpa: number;
  credits: number;
}

/**
 * Owns the optional pre-university CGPA record and folds it into the overall
 * figures. Kept separate so the combination rule lives in one place.
 */
export function usePriorGpa(stats: GpaStats) {
  const [priorGpa, setPriorGpa] = usePersistedState<PriorGpa>(LS_PRIOR, () => ({
    enabled: false, cgpa: 0, credits: 0,
  }));

  const isPriorEnabled = priorGpa.enabled;
  const priorCgpa = priorGpa.cgpa;
  const priorCredits = priorGpa.credits;

  const combinedCgpa = isPriorEnabled && priorCredits > 0
    ? calculateCombinedCgpa(priorCgpa, priorCredits, stats.cgpa, stats.earnedCredits)
    : stats.cgpa;

  const combinedEarned = isPriorEnabled ? stats.earnedCredits + priorCredits : stats.earnedCredits;

  return { priorGpa, setPriorGpa, isPriorEnabled, priorCgpa, priorCredits, combinedCgpa, combinedEarned };
}

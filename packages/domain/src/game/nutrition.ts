import { ActivityLevel, Profile, WeightEntry } from './types';

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725 };

/** Минимальный безопасный ИМТ для цели — ниже не даём поставить. */
export const MIN_TARGET_BMI = 18.5;

export function bmr(p: Pick<Profile, 'sex' | 'age' | 'heightCm'>, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

/** Дневная норма: Миффлин — Сан Жеор × активность, для похудения −15%, но не ниже безопасного пола. */
export function dailyCalorieTarget(p: Profile, currentWeightKg = p.startWeightKg): number {
  const tdee = bmr(p, currentWeightKg) * ACTIVITY_FACTOR[p.activity];
  const losing = p.targetWeightKg < currentWeightKg - 0.5;
  const floor = p.sex === 'male' ? 1500 : 1200;
  const target = losing ? Math.max(tdee * 0.85, floor) : tdee;
  return Math.round(target / 10) * 10;
}

export function minHealthyWeight(heightCm: number): number {
  const m = heightCm / 100;
  return Math.ceil(MIN_TARGET_BMI * m * m * 2) / 2;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/**
 * Сглаженный тренд веса, чтобы колебания воды не демотивировали. Экспоненциальное
 * сглаживание с учётом времени: чем больше дней между взвешиваниями, тем больше
 * веса у нового значения — иначе при редких взвешиваниях тренд безнадёжно отстаёт.
 */
export function smoothWeights(entries: WeightEntry[], tauDays = 7): Array<WeightEntry & { trend: number }> {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let trend: number | null = null;
  let prev: number | null = null;
  return sorted.map((e) => {
    const t = Date.parse(e.date);
    const days = prev == null ? 0 : Math.max(0, (t - prev) / 86_400_000);
    const alpha = 1 - Math.exp(-days / tauDays);
    prev = t;
    trend = trend == null ? e.kg : trend + alpha * (e.kg - trend);
    return { ...e, trend: Math.round(trend * 10) / 10 };
  });
}

export function currentWeight(p: Profile, weights: WeightEntry[]): number {
  const smoothed = smoothWeights(weights);
  return smoothed.length ? smoothed[smoothed.length - 1]!.trend : p.startWeightKg;
}

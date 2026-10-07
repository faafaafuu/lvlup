import { Platform } from 'react-native';
import { DateKey } from '@levelup/domain';

/**
 * HealthKit через @kingstinct/react-native-healthkit. При сайдлоаде бесплатным Apple ID
 * entitlement HealthKit может не пережить переподпись — тогда всё здесь тихо возвращает
 * null, а шаги/сон/вес вводятся вручную на экране «Прогресс».
 */
type HK = typeof import('@kingstinct/react-native-healthkit');
let hk: HK | null = null;
if (Platform.OS === 'ios') {
  try {
    hk = require('@kingstinct/react-native-healthkit') as HK;
  } catch {
    hk = null;
  }
}

const READ = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierBodyMass',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKWorkoutTypeIdentifier',
] as const;

export async function healthAvailable(): Promise<boolean> {
  try {
    return hk != null && (await hk.isHealthDataAvailable());
  } catch {
    return false;
  }
}

export async function requestHealthAccess(): Promise<boolean> {
  if (!(await healthAvailable())) return false;
  try {
    return await hk!.requestAuthorization({ toRead: READ });
  } catch {
    return false;
  }
}

export interface HealthDay {
  steps: number | null;
  sleepHours: number | null;
}

function dayBounds(date: DateKey) {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d + 1) };
}

/** Асинхронные значения сна в HealthKit: 1 — asleep, 3/4/5 — core/deep/REM. */
const ASLEEP_VALUES = new Set([1, 3, 4, 5]);

export async function readHealthDay(date: DateKey): Promise<HealthDay> {
  if (!hk) return { steps: null, sleepHours: null };
  const { start, end } = dayBounds(date);
  let steps: number | null = null;
  let sleepHours: number | null = null;
  try {
    const stats = await hk.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
      filter: { date: { startDate: start, endDate: end } },
      unit: 'count',
    });
    steps = Math.round(stats.sumQuantity?.quantity ?? 0);
  } catch {
    steps = null;
  }
  try {
    // Ночь «на» эту дату: с 18:00 предыдущего дня до 12:00 этого.
    const nightStart = new Date(start.getTime() - 6 * 3600_000);
    const nightEnd = new Date(start.getTime() + 12 * 3600_000);
    const samples = await hk.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: -1,
      filter: { date: { startDate: nightStart, endDate: nightEnd } },
    });
    const ms = samples
      .filter((s) => ASLEEP_VALUES.has(Number(s.value)))
      .reduce((sum, s) => sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()), 0);
    sleepHours = ms > 0 ? Math.round((ms / 3600_000) * 10) / 10 : null;
  } catch {
    sleepHours = null;
  }
  return { steps, sleepHours };
}

export async function readLatestWeight(): Promise<{ kg: number; date: Date } | null> {
  if (!hk) return null;
  try {
    const sample = await hk.getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg');
    return sample ? { kg: Math.round(sample.quantity * 10) / 10, date: new Date(sample.startDate) } : null;
  } catch {
    return null;
  }
}

/** Типы тренировок HealthKit (HKWorkoutActivityType) → наши виды активности. */
const HK_ACTIVITY: Record<number, string> = {
  37: 'running', 52: 'walking', 13: 'cycling', 46: 'swimming', 57: 'yoga', 63: 'hiit',
  50: 'strength', 20: 'strength', 14: 'dancing', 9: 'boxing', 41: 'team_sport', 6: 'team_sport', 48: 'team_sport',
};

export interface HealthWorkout {
  id: string;
  at: string;
  activityId: string;
  minutes: number;
  kcal: number | null;
}

/** Тренировки за день из Здоровья (Apple Watch, Strava, Nike Run и т. п.). */
export async function readHealthWorkouts(date: DateKey): Promise<HealthWorkout[]> {
  if (!hk) return [];
  const { start, end } = dayBounds(date);
  try {
    const workouts = await hk.queryWorkoutSamples({ limit: -1, filter: { date: { startDate: start, endDate: end } } });
    return workouts.map((w) => {
      const startDate = new Date(w.startDate);
      const minutes = Math.max(1, Math.round((new Date(w.endDate).getTime() - startDate.getTime()) / 60_000));
      const kcal = w.totalEnergyBurned?.quantity;
      return {
        id: `hk-${w.uuid}`,
        at: startDate.toISOString(),
        activityId: HK_ACTIVITY[Number(w.workoutActivityType)] ?? 'cardio',
        minutes,
        kcal: kcal != null ? Math.round(kcal) : null,
      };
    });
  } catch {
    return [];
  }
}

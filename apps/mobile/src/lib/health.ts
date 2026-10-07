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

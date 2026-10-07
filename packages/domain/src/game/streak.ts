import { addDays } from './dates';
import { DateKey } from './types';

/**
 * Серия: подряд идущие дни хотя бы с одной записью. Сегодняшний день без записи
 * серию не рвёт — день ещё не закончился. Замороженные дни считаются выполненными.
 */
export function currentStreak(activeDays: Set<DateKey>, today: DateKey, frozen: DateKey[] = []): number {
  const ok = (d: DateKey) => activeDays.has(d) || frozen.includes(d);
  let day = ok(today) ? today : addDays(today, -1);
  let streak = 0;
  while (ok(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Вчерашний пропуск, который ещё можно спасти заморозкой. */
export function rescuableDay(activeDays: Set<DateKey>, today: DateKey, frozen: DateKey[] = []): DateKey | null {
  const yesterday = addDays(today, -1);
  const before = addDays(today, -2);
  const has = (d: DateKey) => activeDays.has(d) || frozen.includes(d);
  return !has(yesterday) && has(before) ? yesterday : null;
}

export const STREAK_MILESTONES: Array<[days: number, coins: number]> = [
  [3, 10],
  [7, 25],
  [14, 50],
  [30, 100],
  [60, 150],
  [100, 300],
];

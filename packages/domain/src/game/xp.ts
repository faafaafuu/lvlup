import { addDays, dateKey, mealDateKey } from './dates';
import { dayStats } from './stats';
import { DateKey, GameState } from './types';

/**
 * Опыт, уровни, монеты, серия и достижения — всё выводится из записей, ничего не хранится.
 * Поэтому удалённая запись честно убирает свой опыт, а повторный подсчёт не даёт дублей.
 */
export const XP_PER_ENTRY = 25;
export const ENTRY_XP_CAP = 8; // записей еды в день, за которые даётся опыт
export const XP_PER_WORKOUT = 25;
export const WORKOUT_XP_CAP = 4;
export const XP_STEPS_GOAL = 50;
export const XP_PER_ACHIEVEMENT = 100;
export const XP_PER_LEVEL = 1000;
export const COINS_PER_DAY = 5;
export const COINS_PER_ACHIEVEMENT = 20;

export interface Achievement {
  id: 'first' | 'streak7' | 'steps10k' | 'early' | 'water8' | 'month';
  title: string;
  icon: 'check' | 'streak' | 'steps' | 'sun' | 'water' | 'crown';
  done: boolean;
  /** Прогресс для незакрытых: «6/7». */
  progress: number;
  target: number;
}

export interface GameSummary {
  xp: number;
  level: number;
  /** Опыт внутри текущего уровня. */
  levelXp: number;
  coins: number;
  /** Дней подряд с записями (сегодня без записей серию не рвёт). */
  streak: number;
  achievements: Achievement[];
}

function activeDays(s: GameState): DateKey[] {
  const days = new Set<DateKey>(s.meals.map((m) => mealDateKey(m.at)));
  for (const [d, a] of Object.entries(s.activity)) if (a.sessions?.length) days.add(d);
  return [...days].sort();
}

/** Опыт за один день (без достижений). */
export function dayXp(s: GameState, day: DateKey): number {
  const meals = s.meals.filter((m) => mealDateKey(m.at) === day).length;
  const a = s.activity[day];
  const workouts = a?.sessions?.length ?? 0;
  const steps = a?.steps ?? 0;
  return (
    Math.min(meals, ENTRY_XP_CAP) * XP_PER_ENTRY +
    Math.min(workouts, WORKOUT_XP_CAP) * XP_PER_WORKOUT +
    (steps >= s.profile.stepsGoal ? XP_STEPS_GOAL : 0)
  );
}

export function currentStreakDays(days: Set<DateKey>, today: DateKey): number {
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

function bestStreak(sorted: DateKey[]): number {
  let best = 0;
  let run = 0;
  let prev: DateKey | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function achievements(s: GameState, today: DateKey): Achievement[] {
  const days = activeDays(s);
  const set = new Set(days);
  const streak = currentStreakDays(set, today);
  const maxSteps = Math.max(0, ...Object.values(s.activity).map((a) => a.steps ?? 0));
  const early = s.meals.some((m) => new Date(m.at).getHours() < 8);
  const water = (d: DateKey) => Math.floor(dayStats(d, s.meals, s.activity[d]).waterMl / 250);
  const bestWater = Math.max(0, ...days.map(water), water(today));
  const mk = (id: Achievement['id'], title: string, icon: Achievement['icon'], done: boolean, progress: number, target: number): Achievement => ({
    id, title, icon, done, progress: Math.min(progress, target), target,
  });
  return [
    mk('first', 'Первая запись', 'check', s.meals.length > 0, s.meals.length > 0 ? 1 : 0, 1),
    mk('streak7', '7 дней подряд', 'streak', bestStreak(days) >= 7, streak, 7),
    mk('steps10k', '10 000 шагов', 'steps', maxSteps >= 10000, Math.round(maxSteps / 1000), 10),
    mk('early', 'Ранняя пташка', 'sun', early, early ? 1 : 0, 1),
    mk('water8', '8 стаканов воды', 'water', bestWater >= 8, water(today), 8),
    mk('month', 'Месяц с Хрумом', 'crown', days.length >= 30, days.length, 30),
  ];
}

export function gameSummary(s: GameState, now: Date = new Date()): GameSummary {
  const today = dateKey(now);
  const days = new Set<DateKey>([...activeDays(s), ...Object.keys(s.activity)]);
  const ach = achievements(s, today);
  const doneCount = ach.filter((a) => a.done).length;
  const xp = [...days].reduce((n, d) => n + dayXp(s, d), 0) + doneCount * XP_PER_ACHIEVEMENT;
  const logged = activeDays(s);
  return {
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelXp: xp % XP_PER_LEVEL,
    coins: logged.length * COINS_PER_DAY + doneCount * COINS_PER_ACHIEVEMENT,
    streak: currentStreakDays(new Set(logged), today),
    achievements: ach,
  };
}

/** Приём пищи по времени — для заголовков дневника и экрана награды. */
export function mealSlot(iso: string): 'Завтрак' | 'Обед' | 'Перекус' | 'Ужин' {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 11) return 'Завтрак';
  if (h >= 11 && h < 16) return 'Обед';
  if (h >= 18 && h < 23) return 'Ужин';
  return 'Перекус';
}

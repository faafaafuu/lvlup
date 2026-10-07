import { Nutrients, ResolvedItem } from '../food/types';

/** Дата в локальной зоне пользователя: '2026-10-07'. */
export type DateKey = string;

export interface MealLog {
  id: string;
  /** ISO-время записи. */
  at: string;
  text: string;
  items: ResolvedItem[];
  totals: Nutrients;
}

export interface DayActivity {
  date: DateKey;
  steps?: number;
  sleepHours?: number;
  /** Вода, отмеченная отдельно от еды. */
  waterMl?: number;
  workouts?: number;
  /** id квестов, отмеченных вручную («Сделай 10 отжиманий»). */
  manualDone?: string[];
}

export interface WeightEntry {
  date: DateKey;
  kg: number;
}

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';

export interface Profile {
  name?: string;
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  targetWeightKg: number;
  activity: ActivityLevel;
  stepsGoal: number;
}

/** Всё, что заработано. Награды выдаются по уникальному ключу — повторно не начисляются. */
export interface Progress {
  xp: number;
  coins: number;
  claimed: Record<string, true>;
  achievements: string[];
  /** Дни, спасённые заморозкой серии. */
  frozenDays: DateKey[];
  /** Дни с бустером «Двойной XP». */
  doubleXpDays: DateKey[];
  inventory: string[];
  equipped: Record<string, string>;
}

export interface Reward {
  key: string;
  title: string;
  xp: number;
  coins: number;
  kind: 'meal' | 'activity' | 'quest' | 'chest' | 'achievement' | 'streak';
}

export interface GameState {
  profile: Profile;
  meals: MealLog[];
  activity: Record<DateKey, DayActivity>;
  weights: WeightEntry[];
  progress: Progress;
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  coins: 0,
  claimed: {},
  achievements: [],
  frozenDays: [],
  doubleXpDays: [],
  inventory: [],
  equipped: {},
};

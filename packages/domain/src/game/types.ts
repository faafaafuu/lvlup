import { ActivitySession } from '../activity/types';
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
  /** Тренировки, записанные голосом или вручную. */
  sessions?: ActivitySession[];
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

export interface GameState {
  profile: Profile;
  meals: MealLog[];
  activity: Record<DateKey, DayActivity>;
  weights: WeightEntry[];
}

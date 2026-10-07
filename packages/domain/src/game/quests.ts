import { CATALOG_BY_ID } from '../food/catalog';
import { DateKey, DayActivity, MealLog, Profile } from './types';
import { mealDateKey } from './dates';

export interface DayStats {
  meals: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  waterMl: number;
  steps: number;
  sleepHours: number;
  workouts: number;
  activeMinutes: number;
  burnedKcal: number;
  fruitVegServings: number;
  sweetsAfter18: boolean;
  breakfastBy10: boolean;
  alcohol: boolean;
  sweets: boolean;
  manualDone: string[];
}

export function dayStats(date: DateKey, meals: MealLog[], activity?: DayActivity): DayStats {
  const today = meals.filter((m) => mealDateKey(m.at) === date);
  const stats: DayStats = {
    meals: today.length,
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    waterMl: activity?.waterMl ?? 0,
    steps: activity?.steps ?? 0,
    sleepHours: activity?.sleepHours ?? 0,
    workouts: (activity?.workouts ?? 0) + (activity?.sessions?.length ?? 0),
    activeMinutes: (activity?.sessions ?? []).reduce((m, s) => m + s.minutes, 0),
    burnedKcal: (activity?.sessions ?? []).reduce((k, s) => k + s.kcal, 0),
    fruitVegServings: 0,
    sweetsAfter18: false,
    breakfastBy10: false,
    alcohol: false,
    sweets: false,
    manualDone: activity?.manualDone ?? [],
  };
  for (const meal of today) {
    const hour = new Date(meal.at).getHours();
    if (hour < 10) stats.breakfastBy10 = true;
    stats.kcal += meal.totals.kcal;
    stats.protein += meal.totals.protein;
    stats.fat += meal.totals.fat;
    stats.carbs += meal.totals.carbs;
    for (const item of meal.items) {
      const tags = CATALOG_BY_ID.get(item.foodId)?.tags ?? [];
      if (tags.includes('water')) stats.waterMl += item.grams;
      if (tags.includes('fruit') || tags.includes('vegetable')) stats.fruitVegServings += 1;
      if (tags.includes('alcohol')) stats.alcohol = true;
      if (tags.includes('sweet')) {
        stats.sweets = true;
        if (hour >= 18) stats.sweetsAfter18 = true;
      }
    }
  }
  return stats;
}

export interface QuestDef {
  id: string;
  title: string;
  icon: 'meal' | 'steps' | 'water' | 'sleep' | 'workout' | 'veg' | 'protein' | 'clock' | 'nosweet';
  /** manual — отмечается пользователем вручную. */
  manual?: boolean;
  target: (p: Profile) => number;
  progress: (s: DayStats, hour: number) => number;
  unit?: string;
}

export const QUEST_XP = 25;
export const QUEST_COINS = 5;
export const CHEST_COINS = 30;
export const QUESTS_PER_DAY = 3;

export const QUEST_POOL: QuestDef[] = [
  { id: 'log_3_meals', title: 'Запиши 3 приёма пищи', icon: 'meal', target: () => 3, progress: (s) => s.meals },
  { id: 'steps', title: 'Пройди дневную цель шагов', icon: 'steps', unit: 'шагов', target: (p) => p.stepsGoal, progress: (s) => s.steps },
  { id: 'water_2l', title: 'Выпей 2 литра воды', icon: 'water', unit: 'мл', target: () => 2000, progress: (s) => s.waterMl },
  { id: 'breakfast_by_10', title: 'Позавтракай до 10:00', icon: 'clock', target: () => 1, progress: (s) => (s.breakfastBy10 ? 1 : 0) },
  { id: 'fruit_veg_2', title: 'Овощи или фрукты 2 раза', icon: 'veg', target: () => 2, progress: (s) => s.fruitVegServings },
  { id: 'protein_80', title: 'Съешь 80 г белка', icon: 'protein', unit: 'г', target: () => 80, progress: (s) => Math.round(s.protein) },
  { id: 'sleep_7h', title: 'Поспи 7+ часов', icon: 'sleep', unit: 'ч', target: () => 7, progress: (s) => s.sleepHours },
  {
    id: 'no_sweets_evening',
    title: 'Без сладкого после 18:00',
    icon: 'nosweet',
    target: () => 1,
    // Засчитывается вечером, если сладкого после 18 не было.
    progress: (s, hour) => (!s.sweetsAfter18 && hour >= 21 ? 1 : 0),
  },
  { id: 'pushups_10', title: 'Сделай 10 отжиманий', icon: 'workout', manual: true, target: () => 1, progress: (s) => (s.manualDone.includes('pushups_10') ? 1 : 0) },
  { id: 'walk_20', title: 'Прогулка 20 минут', icon: 'steps', manual: true, target: () => 1, progress: (s) => (s.manualDone.includes('walk_20') ? 1 : 0) },
  { id: 'workout', title: 'Тренировка', icon: 'workout', target: () => 1, progress: (s) => s.workouts },
];

/** Детерминированный выбор квестов дня: одинаковый на всех устройствах и при перезапуске. */
export function dailyQuests(date: DateKey, count = QUESTS_PER_DAY): QuestDef[] {
  const pool = [...QUEST_POOL];
  let seed = hash(date);
  const picked: QuestDef[] = [];
  // Первый квест дня — всегда про запись еды: это ядро приложения.
  picked.push(pool.splice(0, 1)[0]!);
  while (picked.length < count && pool.length) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    picked.push(pool.splice(seed % pool.length, 1)[0]!);
  }
  return picked;
}

export interface QuestStatus {
  quest: QuestDef;
  progress: number;
  target: number;
  done: boolean;
}

export function questStatuses(date: DateKey, profile: Profile, stats: DayStats, hour: number): QuestStatus[] {
  return dailyQuests(date).map((quest) => {
    const target = quest.target(profile);
    const progress = Math.min(target, quest.progress(stats, hour));
    return { quest, progress, target, done: progress >= target };
  });
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

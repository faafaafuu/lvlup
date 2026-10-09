import { CATALOG_BY_ID } from '../food/catalog';
import { DateKey, DayActivity, MealLog } from './types';
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

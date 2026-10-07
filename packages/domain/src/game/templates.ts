import { Nutrients, ResolvedItem } from '../food/types';
import { MealLog } from './types';

export interface MealTemplate {
  key: string;
  label: string;
  items: ResolvedItem[];
  totals: Nutrients;
  uses: number;
}

/** Частые приёмы пищи для «одного тапа»: одинаковый набор блюд и граммов = один шаблон. */
export function topTemplates(meals: MealLog[], limit = 5, minUses = 2): MealTemplate[] {
  const groups = new Map<string, { meal: MealLog; uses: number; lastAt: string }>();
  for (const meal of meals) {
    if (!meal.items.length) continue;
    const key = meal.items
      .map((i) => `${i.foodId}:${i.grams}`)
      .sort()
      .join('|');
    const g = groups.get(key);
    if (g) {
      g.uses++;
      if (meal.at > g.lastAt) g.lastAt = meal.at;
    } else {
      groups.set(key, { meal, uses: 1, lastAt: meal.at });
    }
  }
  return [...groups.entries()]
    .filter(([, g]) => g.uses >= minUses)
    .sort(([, a], [, b]) => b.uses - a.uses || b.lastAt.localeCompare(a.lastAt))
    .slice(0, limit)
    .map(([key, g]) => ({
      key,
      label: g.meal.items.map((i) => i.name).join(' + '),
      items: g.meal.items,
      totals: g.meal.totals,
      uses: g.uses,
    }));
}

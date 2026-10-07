import { addDays, mealDateKey } from './dates';
import { questStatuses, dayStats } from './quests';
import { levelInfo } from './levels';
import { DateKey, GameState } from './types';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  check: (s: GameState, today: DateKey) => boolean;
}

const STEP_LENGTH_KM = 0.00075;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_blood', title: 'Первая кровь', description: 'Первая запись еды', check: (s) => s.meals.length >= 1 },
  { id: 'hundred_meals', title: 'Летописец', description: '100 записей еды', check: (s) => s.meals.length >= 100 },
  {
    id: 'week_of_power',
    title: 'Неделя силы',
    description: '7 дней подряд все квесты выполнены',
    check: (s, today) => consecutiveDays(today, 7, (d) => allQuestsDone(s, d)),
  },
  {
    id: 'iron_will',
    title: 'Железная воля',
    description: '30 дней с записями без алкоголя и сладкого',
    check: (s, today) =>
      consecutiveDays(addDays(today, -1), 30, (d) => {
        const st = dayStats(d, s.meals, s.activity[d]);
        return st.meals > 0 && !st.alcohol && !st.sweets;
      }),
  },
  {
    id: 'marathon',
    title: 'Марафонец',
    description: 'Суммарно пройдено 100 км',
    check: (s) => Object.values(s.activity).reduce((km, a) => km + (a.steps ?? 0) * STEP_LENGTH_KM, 0) >= 100,
  },
  { id: 'level_5', title: 'Набирая высоту', description: 'Достигни 5 уровня', check: (s) => levelInfo(s.progress.xp).level >= 5 },
  { id: 'level_10', title: 'Герой', description: 'Достигни 10 уровня', check: (s) => levelInfo(s.progress.xp).level >= 10 },
  {
    id: 'first_kg',
    title: 'Первый килограмм',
    description: 'Минус 1 кг от старта по тренду',
    check: (s) => s.weights.length > 0 && Math.min(...s.weights.map((w) => w.kg)) <= s.profile.startWeightKg - 1,
  },
];

export function allQuestsDone(s: GameState, date: DateKey): boolean {
  const stats = dayStats(date, s.meals, s.activity[date]);
  // Прошедшие дни оцениваем как закрытые — час 23.
  return questStatuses(date, s.profile, stats, 23).every((q) => q.done);
}

function consecutiveDays(lastDay: DateKey, count: number, ok: (d: DateKey) => boolean): boolean {
  for (let i = 0; i < count; i++) if (!ok(addDays(lastDay, -i))) return false;
  return true;
}

export function activeDays(s: GameState): Set<DateKey> {
  return new Set(s.meals.map((m) => mealDateKey(m.at)));
}

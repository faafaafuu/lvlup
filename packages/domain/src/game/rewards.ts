import { ACHIEVEMENTS, activeDays } from './achievements';
import { addDays, dateKey, mealDateKey } from './dates';
import { levelInfo } from './levels';
import { CHEST_COINS, QUEST_COINS, QUEST_XP, dayStats, questStatuses } from './quests';
import { STREAK_MILESTONES, currentStreak } from './streak';
import { GameState, Progress, Reward } from './types';

export const XP = {
  meal: 10,
  workout: 50,
  steps: 30,
  sleep: 20,
  achievement: 100,
} as const;

/** Сколько записей еды в день приносят XP — дальше записывать можно, но без опыта. */
export const MEAL_XP_DAILY_CAP = 6;

export interface RewardResult {
  progress: Progress;
  rewards: Reward[];
  levelUp: number | null;
}

/**
 * Выдаёт все положенные и ещё не выданные награды. Идемпотентна: каждая награда
 * имеет ключ, поэтому её можно звать после любого события (запись, синк шагов,
 * открытие приложения) — дубли не начислятся.
 */
export function collectRewards(state: GameState, now: Date = new Date()): RewardResult {
  const today = dateKey(now);
  const progress: Progress = { ...state.progress, claimed: { ...state.progress.claimed }, achievements: [...state.progress.achievements] };
  const rewards: Reward[] = [];
  const startLevel = levelInfo(progress.xp).level;

  const grant = (r: Reward) => {
    if (progress.claimed[r.key]) return;
    const day = r.key.split(':')[1] ?? '';
    const multiplier = progress.doubleXpDays.includes(day) ? 2 : 1;
    const granted = { ...r, xp: r.xp * multiplier };
    progress.claimed[r.key] = true;
    progress.xp += granted.xp;
    progress.coins += granted.coins;
    rewards.push(granted);
  };

  // Еда: +10 за запись, не больше MEAL_XP_DAILY_CAP записей в день.
  const mealsPerDay = new Map<string, number>();
  for (const meal of [...state.meals].sort((a, b) => a.at.localeCompare(b.at))) {
    const day = mealDateKey(meal.at);
    const n = (mealsPerDay.get(day) ?? 0) + 1;
    mealsPerDay.set(day, n);
    if (n <= MEAL_XP_DAILY_CAP) grant({ key: `meal:${day}:${meal.id}`, title: 'Запись еды', xp: XP.meal, coins: 0, kind: 'meal' });
  }

  // Активность и квесты — только за сегодня и вчера (синк здоровья часто опаздывает).
  const yesterday = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  for (const day of [yesterday, today]) {
    const a = state.activity[day];
    const stats = dayStats(day, state.meals, a);
    if (stats.steps >= state.profile.stepsGoal) grant({ key: `steps:${day}`, title: 'Цель по шагам', xp: XP.steps, coins: 0, kind: 'activity' });
    if (stats.sleepHours >= 7) grant({ key: `sleep:${day}`, title: 'Сон 7+ часов', xp: XP.sleep, coins: 0, kind: 'activity' });
    for (let i = 1; i <= Math.min(stats.workouts, 2); i++) {
      grant({ key: `workout:${day}:${i}`, title: 'Тренировка', xp: XP.workout, coins: 0, kind: 'activity' });
    }
    const hour = day === today ? now.getHours() : 23;
    const quests = questStatuses(day, state.profile, stats, hour);
    for (const q of quests) {
      if (q.done) grant({ key: `quest:${day}:${q.quest.id}`, title: q.quest.title, xp: QUEST_XP, coins: QUEST_COINS, kind: 'quest' });
    }
    if (quests.every((q) => q.done)) grant({ key: `chest:${day}`, title: 'Сундук дня', xp: 0, coins: CHEST_COINS, kind: 'chest' });
  }

  // Ключ привязан к началу серии: та же серия не наградит дважды, новая — наградит.
  const days = activeDays(state);
  const streak = currentStreak(days, today, progress.frozenDays);
  const lastDay = days.has(today) || progress.frozenDays.includes(today) ? today : yesterday;
  const runStart = addDays(lastDay, -(streak - 1));
  for (const [milestone, coins] of STREAK_MILESTONES) {
    if (streak >= milestone) grant({ key: `streak:${runStart}:${milestone}`, title: `Серия ${milestone} дней`, xp: 0, coins, kind: 'streak' });
  }

  // Достижения проверяем на обновлённом прогрессе (уровни могли вырасти выше).
  const checked = { ...state, progress };
  for (const a of ACHIEVEMENTS) {
    if (progress.achievements.includes(a.id) || !a.check(checked, today)) continue;
    progress.achievements.push(a.id);
    grant({ key: `ach:${today}:${a.id}`, title: a.title, xp: XP.achievement, coins: 20, kind: 'achievement' });
  }

  const endLevel = levelInfo(progress.xp).level;
  return { progress, rewards, levelUp: endLevel > startLevel ? endLevel : null };
}

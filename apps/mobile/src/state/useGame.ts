import { useMemo } from 'react';
import {
  activeDays, avatarStage, currentStreak, currentWeight, dailyCalorieTarget, dateKey, dayStats, levelInfo, questStatuses, topTemplates,
} from '@levelup/domain';
import { useStore } from './store';

/** Производные игровые значения для экранов: всё считается из сохранённых данных, ничего не дублируется. */
export function useGame() {
  const profile = useStore((s) => s.profile);
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const weights = useStore((s) => s.weights);
  const progress = useStore((s) => s.progress);

  return useMemo(() => {
    const now = new Date();
    const today = dateKey(now);
    const level = levelInfo(progress.xp);
    if (!profile) return null;
    const stats = dayStats(today, meals, activity[today]);
    const weight = currentWeight(profile, weights);
    return {
      today,
      level,
      stats,
      quests: questStatuses(today, profile, stats, now.getHours()),
      streak: currentStreak(activeDays({ profile, meals, activity, weights, progress }), today, progress.frozenDays),
      norm: dailyCalorieTarget(profile, weight),
      weight,
      stage: avatarStage(profile, weights),
      templates: topTemplates(meals, 5),
      doubleXp: progress.doubleXpDays.includes(today),
    };
  }, [profile, meals, activity, weights, progress]);
}

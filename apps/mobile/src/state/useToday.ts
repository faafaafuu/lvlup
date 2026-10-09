import { useMemo } from 'react';
import { bankSummary, currentWeight, dateKey, dayStats, normOn, topTemplates, youStats } from '@levelup/domain';
import { useStore } from './store';

/** Всё производное для экранов: считается из сохранённых данных, ничего не дублируется. */
export function useToday() {
  const profile = useStore((s) => s.profile);
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const weights = useStore((s) => s.weights);
  const motivation = useStore((s) => s.motivation);

  return useMemo(() => {
    if (!profile) return null;
    const today = dateKey(new Date());
    const state = { profile, meals, activity, weights };
    return {
      today,
      state,
      stats: dayStats(today, meals, activity[today]),
      norm: normOn(state, today),
      weight: currentWeight(profile, weights),
      bank: bankSummary(state, motivation, today),
      you: youStats(state, motivation.rates, today),
      templates: topTemplates(meals, 5),
    };
  }, [profile, meals, activity, weights, motivation]);
}

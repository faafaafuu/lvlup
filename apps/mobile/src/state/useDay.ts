import { useMemo } from 'react';
import { DateKey, currentWeight, dateKey, dayStats, gameSummary, normOn } from '@levelup/domain';
import { useStore } from './store';

/** Всё производное для экранов: день, норма, опыт/уровень — считается из записей. */
export function useDay(day?: DateKey) {
  const profile = useStore((s) => s.profile);
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const weights = useStore((s) => s.weights);
  const viewDate = useStore((s) => s.viewDate);
  const d = day ?? viewDate;

  return useMemo(() => {
    if (!profile) return null;
    const state = { profile, meals, activity, weights };
    return {
      day: d,
      today: dateKey(new Date()),
      state,
      stats: dayStats(d, meals, activity[d]),
      norm: normOn(state, d),
      weight: currentWeight(profile, weights),
      game: gameSummary(state),
    };
  }, [profile, meals, activity, weights, d]);
}

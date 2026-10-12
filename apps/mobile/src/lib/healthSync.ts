import { ACTIVITY_BY_ID, DateKey, activityKcal, addDays, currentWeight, dateKey } from '@levelup/domain';
import { useStore } from '@/state/store';
import { readHealthDay, readHealthWorkouts, readWeights } from './health';

export interface SyncReport {
  days: number;
  steps: number;
  workouts: number;
  weights: number;
}

/**
 * Подтягивает из Здоровья шаги, сон, активные калории, тренировки и вес за дни
 * [today-days+1 … today]. Безопасно звать сколько угодно раз: данные дня перезаписываются,
 * тренировки и взвешивания дедуплицируются.
 */
export async function syncHealth(days: number, only?: DateKey): Promise<SyncReport> {
  const report: SyncReport = { days: 0, steps: 0, workouts: 0, weights: 0 };
  if (!useStore.getState().settings.health) return report;
  const today = dateKey(new Date());
  const list = only ? [only] : Array.from({ length: days }, (_, i) => addDays(today, -i));

  for (const day of list) {
    const h = await readHealthDay(day);
    const patch: { steps?: number; sleepHours?: number; activeKcal?: number } = {};
    if (h.steps != null) {
      patch.steps = h.steps;
      if (h.steps > 0) report.steps++;
    }
    if (h.sleepHours != null) patch.sleepHours = h.sleepHours;
    if (h.activeKcal != null) patch.activeKcal = h.activeKcal;
    if (Object.keys(patch).length) useStore.getState().patchActivity(day, patch);

    const st = useStore.getState();
    const known = new Set((st.activity[day]?.sessions ?? []).map((x) => x.id));
    const kg = st.profile ? currentWeight(st.profile, st.weights) : 75;
    const fresh = (await readHealthWorkouts(day))
      .filter((w) => !known.has(w.id))
      .map((w) => {
        const def = ACTIVITY_BY_ID.get(w.activityId)!;
        return { id: w.id, at: w.at, activityId: def.id, name: def.name, text: 'Здоровье', minutes: w.minutes, reps: null, weightKg: null, assumed: false, kcal: w.kcal ?? activityKcal(def, w.minutes, kg) };
      });
    if (fresh.length) {
      st.patchActivity(day, { sessions: [...(st.activity[day]?.sessions ?? []), ...fresh] });
      report.workouts += fresh.length;
    }
    report.days++;
  }

  if (!only) {
    for (const w of await readWeights(Math.max(days, 60))) {
      const known = useStore.getState().weights.find((x) => x.date === w.date);
      if (!known || known.kg !== w.kg) {
        useStore.getState().addWeight(w.kg, w.date);
        report.weights++;
      }
    }
  }
  useStore.getState().updateSettings({ healthSyncedAt: new Date().toISOString() });
  return report;
}

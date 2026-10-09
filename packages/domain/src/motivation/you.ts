import { addDays } from '../game/dates';
import { currentWeight, smoothWeights } from '../game/nutrition';
import { dayStats } from '../game/stats';
import { DateKey, GameState } from '../game/types';
import { evaluateDay } from './day';
import { RateChange } from './types';

/**
 * «Ты вместо персонажа»: четыре характеристики из реальных данных, 0–100.
 * У каждой есть сравнение с прошлым периодом — растёт ли она на самом деле.
 */
export interface YouStat {
  id: 'discipline' | 'strength' | 'endurance' | 'shape';
  title: string;
  value: number;
  previous: number;
  detail: string;
}

const STRENGTH = new Set(['strength', 'pushups', 'squats', 'pullups', 'plank', 'hiit', 'boxing']);
const CARDIO = new Set(['running', 'cycling', 'swimming', 'cardio', 'walking', 'team_sport', 'skiing', 'dancing', 'hiit']);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function range(end: DateKey, days: number): DateKey[] {
  return Array.from({ length: days }, (_, i) => addDays(end, -i - 1));
}

function minutes(state: GameState, days: DateKey[], kinds: Set<string>): number {
  return days.reduce((n, d) => n + (state.activity[d]?.sessions ?? []).filter((s) => kinds.has(s.activityId)).reduce((m, s) => m + s.minutes, 0), 0);
}

export function youStats(state: GameState, rates: RateChange[], today: DateKey): YouStat[] {
  const p = state.profile;
  const last14 = range(today, 14);
  const prev14 = range(addDays(today, -14), 14);
  const good = (days: DateKey[]) => days.filter((d) => evaluateDay(state, d, rates, true).good).length;

  // Неделя включает сегодня: тренировка засчитывается сразу, а не завтра.
  const week = range(addDays(today, 1), 7);
  const prevWeek = range(addDays(today, -6), 7);
  const strength = (days: DateKey[]) => clamp((minutes(state, days, STRENGTH) / 150) * 100);
  const endurance = (days: DateKey[]) => {
    const steps = days.reduce((n, d) => n + dayStats(d, state.meals, state.activity[d]).steps, 0) / days.length;
    return clamp((steps / p.stepsGoal) * 70 + (minutes(state, days, CARDIO) / 150) * 30);
  };

  const total = p.startWeightKg - p.targetWeightKg;
  const shapeAt = (date: DateKey) => {
    const w = currentWeight(p, state.weights.filter((x) => x.date <= date));
    return total > 0.5 ? clamp(((p.startWeightKg - w) / total) * 100) : 100;
  };
  const trend = smoothWeights(state.weights).at(-1)?.trend ?? p.startWeightKg;
  const goodNow = good(last14);

  return [
    { id: 'discipline', title: 'Дисциплина', value: clamp((goodNow / 14) * 100), previous: clamp((good(prev14) / 14) * 100), detail: `${goodNow} хороших дней из 14` },
    { id: 'strength', title: 'Сила', value: strength(week), previous: strength(prevWeek), detail: `${minutes(state, week, STRENGTH)} мин силовых за неделю (цель 150)` },
    { id: 'endurance', title: 'Выносливость', value: endurance(week), previous: endurance(prevWeek), detail: 'шаги и кардио за неделю' },
    {
      id: 'shape',
      title: 'Форма',
      value: shapeAt(today),
      previous: shapeAt(addDays(today, -14)),
      detail: total > 0.5 ? `${Math.round(trend * 10) / 10} кг → цель ${p.targetWeightKg} кг` : `${Math.round(trend * 10) / 10} кг`,
    },
  ];
}

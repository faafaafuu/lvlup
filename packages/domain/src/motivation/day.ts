import { addDays } from '../game/dates';
import { currentWeight, dailyCalorieTarget } from '../game/nutrition';
import { dayStats } from '../game/stats';
import { DateKey, GameState } from '../game/types';
import { DayCheck, DayResult, RateChange } from './types';

/** Нижняя граница плана: меньше — это не дисциплина, а недоедание, и его не поощряем. */
export const PLAN_MIN_SHARE = 0.6;
export const PLAN_MAX_SHARE = 1.1;
export const MOVE_MINUTES = 20;

export function rateOn(rates: RateChange[], date: DateKey): number {
  let rate = 0;
  for (const r of [...rates].sort((a, b) => a.from.localeCompare(b.from))) if (r.from <= date) rate = r.rate;
  return rate;
}

export function normOn(state: GameState, date: DateKey): number {
  const upTo = state.weights.filter((w) => w.date <= date);
  return dailyCalorieTarget(state.profile, currentWeight(state.profile, upTo));
}

/**
 * Три понятных условия дня вместо случайных квестов. Сегодняшний день считается «вживую»
 * (может ещё измениться), прошедшие — окончательно, и только за них капают деньги.
 */
export function evaluateDay(state: GameState, date: DateKey, rates: RateChange[], closed: boolean): DayResult {
  const s = dayStats(date, state.meals, state.activity[date]);
  const norm = normOn(state, date);
  const low = Math.round(norm * PLAN_MIN_SHARE);
  const high = Math.round(norm * PLAN_MAX_SHARE);
  const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');

  const logged: DayCheck = {
    id: 'logged',
    title: 'Записать питание',
    done: s.meals >= 2,
    detail: s.meals >= 2 ? `${s.meals} записи` : `${s.meals} из 2 записей`,
  };
  const inPlan = s.meals > 0 && s.kcal <= high && (s.kcal >= low || !closed);
  const plan: DayCheck = {
    id: 'plan',
    title: 'Уложиться в план',
    done: inPlan && s.kcal >= low,
    detail:
      s.meals === 0
        ? `план ${fmt(norm)} ккал`
        : s.kcal > high
          ? `${fmt(s.kcal)} из ${fmt(norm)} — выше плана`
          : s.kcal < low
            ? `${fmt(s.kcal)} из ${fmt(norm)} — поешь ещё, это нормально`
            : `${fmt(s.kcal)} из ${fmt(norm)} ккал`,
  };
  const stepsOk = s.steps >= state.profile.stepsGoal;
  const moved: DayCheck = {
    id: 'moved',
    title: 'Подвигаться',
    done: stepsOk || s.activeMinutes >= MOVE_MINUTES,
    detail: s.activeMinutes > 0 ? `${s.activeMinutes} мин спорта · ${fmt(s.steps)} шагов` : `${fmt(s.steps)} из ${fmt(state.profile.stepsGoal)} шагов или ${MOVE_MINUTES} мин спорта`,
  };

  const checks = [logged, plan, moved];
  const score = checks.filter((c) => c.done).length;
  const good = logged.done && score >= 2;
  const rate = rateOn(rates, date);
  const earned = closed && good ? (score === 3 ? rate : Math.round(rate / 2)) : 0;
  return { date, checks, score, good, earned };
}

/** Закрытые дни с даты старта по вчера включительно. */
export function closedDays(state: GameState, start: DateKey, today: DateKey, rates: RateChange[]): DayResult[] {
  const out: DayResult[] = [];
  for (let d = start; d < today; d = addDays(d, 1)) out.push(evaluateDay(state, d, rates, true));
  return out;
}

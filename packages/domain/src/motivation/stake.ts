import { addDays } from '../game/dates';
import { DateKey, GameState } from '../game/types';
import { evaluateDay } from './day';
import { RateChange, Stake } from './types';

export interface StakeStatus {
  stake: Stake;
  goodDays: number;
  /** Сколько дней недели ещё впереди (включая сегодня). */
  daysLeft: number;
  state: 'active' | 'won' | 'lost';
  /** Для активной ставки: можно ли ещё успеть. */
  reachable: boolean;
}

/** Понедельник недели, в которую входит дата. */
export function weekStartOf(date: DateKey): DateKey {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return addDays(date, -dow);
}

export function stakeStatus(stake: Stake, state: GameState, rates: RateChange[], today: DateKey): StakeStatus {
  let goodDays = 0;
  let daysLeft = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(stake.weekStart, i);
    if (d >= today) {
      daysLeft++;
      // Сегодняшний хороший день уже идёт в зачёт, чтобы прогресс был виден сразу.
      if (d === today && evaluateDay(state, d, rates, false).good) goodDays++;
      continue;
    }
    if (evaluateDay(state, d, rates, true).good) goodDays++;
  }
  const finished = addDays(stake.weekStart, 7) <= today;
  const won = goodDays >= stake.target;
  const state_: StakeStatus['state'] = finished ? (won ? 'won' : 'lost') : won ? 'won' : 'active';
  const futureDays = daysLeft - (evaluateDay(state, today, rates, false).good && today < addDays(stake.weekStart, 7) ? 1 : 0);
  return { stake, goodDays, daysLeft, state: state_, reachable: goodDays + futureDays >= stake.target };
}

import { DateKey } from '../game/types';

/** Реальная награда, которую человек покупает себе сам, когда накопит. */
export interface Wish {
  id: string;
  title: string;
  /** Цена в рублях. */
  price: number;
  createdAt: string;
  claimedAt?: string | null;
}

/** Сколько рублей приносит хороший день, начиная с даты (меняется только вперёд). */
export interface RateChange {
  from: DateKey;
  rate: number;
}

/** Отметка «перевёл реальные деньги в копилку» — чтобы копилка была не только на экране. */
export interface Transfer {
  id: string;
  at: string;
  amount: number;
}

/**
 * Ставка на себя на неделю (пн–вс): «если хороших дней меньше target — отдаю amount ₽ тому-то».
 * Выигрыш добавляет в копилку бонус, проигрыш — долг, который отмечается оплаченным вручную.
 */
export interface Stake {
  id: string;
  weekStart: DateKey;
  amount: number;
  target: number;
  recipient: string;
  paidAt?: string | null;
}

export interface MotivationState {
  startDate: DateKey;
  rates: RateChange[];
  wishes: Wish[];
  transfers: Transfer[];
  stakes: Stake[];
}

export type CheckId = 'logged' | 'plan' | 'moved';

export interface DayCheck {
  id: CheckId;
  title: string;
  done: boolean;
  detail: string;
}

export interface DayResult {
  date: DateKey;
  checks: DayCheck[];
  /** Сколько из трёх условий выполнено. */
  score: number;
  /** Хороший день: питание записано и выполнено ещё хотя бы одно условие. */
  good: boolean;
  /** Рублей в копилку за день (для закрытых дней). */
  earned: number;
}

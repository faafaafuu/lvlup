import { DateKey, GameState } from '../game/types';
import { closedDays, evaluateDay } from './day';
import { stakeStatus, StakeStatus } from './stake';
import { DayResult, MotivationState, Wish } from './types';

/** Бонус в копилку за выигранную ставку — доля от суммы ставки. */
export const STAKE_WIN_BONUS = 0.2;

export interface BankSummary {
  today: DayResult;
  days: DayResult[];
  /** Заработано за хорошие дни и выигранные ставки. */
  earned: number;
  /** Потрачено на забранные награды. */
  spent: number;
  balance: number;
  /** Сколько реальных денег ещё не переведено в настоящую копилку. */
  toTransfer: number;
  /** Подряд хороших дней (сегодня засчитывается, если уже хороший). */
  streak: number;
  stakes: StakeStatus[];
  /** Ближайшая незабранная награда и прогресс к ней. */
  next: { wish: Wish; progress: number; daysLeft: number | null } | null;
}

export function bankSummary(state: GameState, m: MotivationState, today: DateKey): BankSummary {
  const days = closedDays(state, m.startDate, today, m.rates);
  const todayResult = evaluateDay(state, today, m.rates, false);
  const stakes = m.stakes.map((s) => stakeStatus(s, state, m.rates, today));
  const stakeBonus = stakes.filter((s) => s.state === 'won').reduce((n, s) => n + Math.round(s.stake.amount * STAKE_WIN_BONUS), 0);
  const earned = days.reduce((n, d) => n + d.earned, 0) + stakeBonus;
  const spent = m.wishes.filter((w) => w.claimedAt).reduce((n, w) => n + w.price, 0);
  const transferred = m.transfers.reduce((n, t) => n + t.amount, 0);
  const balance = earned - spent;

  let streak = todayResult.good ? 1 : 0;
  for (let i = days.length - 1; i >= 0 && days[i]!.good; i--) streak++;

  const open = m.wishes.filter((w) => !w.claimedAt).sort((a, b) => a.price - b.price);
  const wish = open[0];
  // Темп — средний заработок за последние 14 закрытых дней.
  const recent = days.slice(-14);
  const pace = recent.length ? recent.reduce((n, d) => n + d.earned, 0) / recent.length : 0;
  const next = wish
    ? {
        wish,
        progress: Math.min(1, Math.max(0, balance) / wish.price),
        daysLeft: balance >= wish.price ? 0 : pace > 0 ? Math.ceil((wish.price - balance) / pace) : null,
      }
    : null;

  return { today: todayResult, days, earned, spent, balance, toTransfer: Math.max(0, earned - transferred), streak, stakes, next };
}

export function canClaim(summary: BankSummary, wish: Wish): boolean {
  return !wish.claimedAt && summary.balance >= wish.price;
}


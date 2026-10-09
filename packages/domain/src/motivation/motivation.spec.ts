import { ActivitySession } from '../activity';
import { GameState, MealLog, Profile } from '../game';
import { MotivationState, bankSummary, evaluateDay, stakeStatus, weekStartOf, youStats } from './index';

const profile: Profile = { sex: 'male', age: 34, heightCm: 178, startWeightKg: 92, targetWeightKg: 80, activity: 'light', stepsGoal: 8000 };

let n = 0;
const meal = (date: string, kcal: number): MealLog => ({
  id: `m${++n}`, at: `${date}T12:00:00`, text: '', items: [], totals: { kcal, protein: 0, fat: 0, carbs: 0 },
});
const gym = (date: string, minutes: number): ActivitySession => ({
  id: `s${++n}`, at: `${date}T19:00:00`, activityId: 'strength', name: 'Силовая', text: '', minutes, reps: null, weightKg: null, assumed: false, kcal: 300,
});

/** Хороший полный день: 2 записи на ~2000 ккал и час в зале. */
function perfectDay(date: string): Partial<GameState> {
  return { meals: [meal(date, 900), meal(date, 1100)], activity: { [date]: { date, sessions: [gym(date, 60)] } } };
}

function state(...parts: Array<Partial<GameState>>): GameState {
  const s: GameState = { profile, meals: [], activity: {}, weights: [] };
  for (const p of parts) {
    s.meals.push(...(p.meals ?? []));
    Object.assign(s.activity, p.activity ?? {});
  }
  return s;
}

const motivation = (extra: Partial<MotivationState> = {}): MotivationState => ({
  startDate: '2026-10-05', rates: [{ from: '2026-10-05', rate: 100 }], wishes: [], transfers: [], stakes: [], ...extra,
});

describe('условия дня', () => {
  it('три из трёх — полная ставка, два — половина', () => {
    const s = state(perfectDay('2026-10-05'));
    expect(evaluateDay(s, '2026-10-05', motivation().rates, true)).toMatchObject({ score: 3, good: true, earned: 100 });
    const noSport = state({ meals: [meal('2026-10-05', 900), meal('2026-10-05', 1000)] });
    expect(evaluateDay(noSport, '2026-10-05', motivation().rates, true)).toMatchObject({ score: 2, good: true, earned: 50 });
  });

  it('недоедание не поощряется', () => {
    const starving = state({ meals: [meal('2026-10-05', 300), meal('2026-10-05', 300)], activity: { '2026-10-05': { date: '2026-10-05', steps: 12000 } } });
    const day = evaluateDay(starving, '2026-10-05', motivation().rates, true);
    expect(day.checks.find((c) => c.id === 'plan')!.done).toBe(false);
  });

  it('без записей питания день не хороший даже со спортом', () => {
    const s = state({ activity: { '2026-10-05': { date: '2026-10-05', sessions: [gym('2026-10-05', 90)], steps: 15000 } } });
    expect(evaluateDay(s, '2026-10-05', motivation().rates, true).good).toBe(false);
  });
});

describe('копилка', () => {
  const s = state(perfectDay('2026-10-05'), perfectDay('2026-10-06'), perfectDay('2026-10-07'));

  it('деньги только за закрытые дни, баланс и прогресс к награде', () => {
    const m = motivation({ wishes: [{ id: 'w', title: 'Кроссовки', price: 1000, createdAt: '' }] });
    const b = bankSummary(s, m, '2026-10-07');
    expect(b.earned).toBe(200);
    expect(b.streak).toBe(3);
    expect(b.next).toMatchObject({ progress: 0.2, daysLeft: 8 });
  });

  it('забранная награда списывается, переводы уменьшают «к переводу»', () => {
    const m = motivation({
      wishes: [{ id: 'w', title: 'Кино', price: 150, createdAt: '', claimedAt: '2026-10-07' }],
      transfers: [{ id: 't', at: '', amount: 100 }],
    });
    const b = bankSummary(s, m, '2026-10-08');
    expect(b).toMatchObject({ earned: 300, spent: 150, balance: 150, toTransfer: 200 });
  });

  it('смена ставки действует только вперёд', () => {
    const m = motivation({ rates: [{ from: '2026-10-05', rate: 100 }, { from: '2026-10-07', rate: 300 }] });
    expect(bankSummary(s, m, '2026-10-08').earned).toBe(500);
  });
});

describe('ставка на себя', () => {
  it('неделя с понедельника', () => {
    expect(weekStartOf('2026-10-08')).toBe('2026-10-05');
    expect(weekStartOf('2026-10-11')).toBe('2026-10-05');
  });

  it('проигрыш после конца недели и бонус за выигрыш', () => {
    const stake = { id: 'k', weekStart: '2026-10-05', amount: 500, target: 3, recipient: 'Саша' };
    const twoDays = state(perfectDay('2026-10-05'), perfectDay('2026-10-06'));
    expect(stakeStatus(stake, twoDays, motivation().rates, '2026-10-12').state).toBe('lost');
    expect(stakeStatus(stake, twoDays, motivation().rates, '2026-10-08')).toMatchObject({ state: 'active', reachable: true });
    const three = state(perfectDay('2026-10-05'), perfectDay('2026-10-06'), perfectDay('2026-10-07'));
    const b = bankSummary(three, motivation({ stakes: [stake] }), '2026-10-12');
    expect(b.stakes[0]!.state).toBe('won');
    expect(b.earned).toBe(300 + 100);
  });
});

it('ты вместо персонажа: сила растёт от тренировок', () => {
  const s = state(perfectDay('2026-10-05'), perfectDay('2026-10-06'));
  const stats = youStats(s, motivation().rates, '2026-10-07');
  const strength = stats.find((x) => x.id === 'strength')!;
  expect(strength.value).toBe(80);
  expect(strength.previous).toBe(0);
});

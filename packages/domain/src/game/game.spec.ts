import { parseHeuristic, resolveMeal } from '../food';
import {
  EMPTY_PROGRESS, GameState, MealLog, Profile, avatarStage, collectRewards, currentStreak, dailyCalorieTarget,
  dailyQuests, levelInfo, minHealthyWeight, rescuableDay, smoothWeights, topTemplates,
} from './index';

const profile: Profile = { sex: 'male', age: 34, heightCm: 178, startWeightKg: 92, targetWeightKg: 80, activity: 'light', stepsGoal: 8000 };

let seq = 0;
function meal(text: string, at: string): MealLog {
  const draft = resolveMeal(text, parseHeuristic(text));
  return { id: `m${++seq}`, at, text, items: draft.items, totals: draft.totals };
}

function state(partial: Partial<GameState> = {}): GameState {
  return { profile, meals: [], activity: {}, weights: [], progress: EMPTY_PROGRESS, ...partial };
}

describe('уровни', () => {
  it('1000 XP на уровень и титулы', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, current: 0, title: 'Новичок' });
    expect(levelInfo(2340)).toMatchObject({ level: 3, current: 340, title: 'Странник' });
  });
});

describe('норма и безопасность', () => {
  it('норма для похудения ниже поддержки, но не ниже пола', () => {
    const target = dailyCalorieTarget(profile);
    expect(target).toBeGreaterThan(1500);
    expect(target).toBeLessThan(2700);
    expect(dailyCalorieTarget({ ...profile, sex: 'female', heightCm: 150, startWeightKg: 50, targetWeightKg: 45, activity: 'sedentary', age: 60 })).toBe(1200);
  });

  it('минимальный целевой вес по ИМТ 18.5', () => {
    expect(minHealthyWeight(178)).toBe(59);
  });

  it('стадия героя растёт по тренду, а не по одному взвешиванию', () => {
    expect(avatarStage(profile, [{ date: '2026-10-01', kg: 84 }])).toBe(2);
    const noisy = [{ date: '2026-10-01', kg: 92 }, { date: '2026-10-02', kg: 92 }, { date: '2026-10-03', kg: 86 }];
    expect(avatarStage(profile, noisy)).toBe(0);
    expect(smoothWeights(noisy).at(-1)!.trend).toBe(90.5);
  });
});

describe('серия', () => {
  const days = new Set(['2026-10-04', '2026-10-05', '2026-10-06']);
  it('сегодня без записи серию не рвёт', () => {
    expect(currentStreak(days, '2026-10-07')).toBe(3);
    expect(currentStreak(days, '2026-10-08')).toBe(0);
  });
  it('заморозка спасает пропуск', () => {
    expect(rescuableDay(days, '2026-10-08')).toBe('2026-10-07');
    expect(currentStreak(days, '2026-10-08', ['2026-10-07'])).toBe(4);
  });
});

describe('квесты', () => {
  it('детерминированы по дате, первый — про еду', () => {
    const a = dailyQuests('2026-10-07').map((q) => q.id);
    expect(a).toEqual(dailyQuests('2026-10-07').map((q) => q.id));
    expect(a[0]).toBe('log_3_meals');
    expect(new Set(a).size).toBe(3);
  });
});

describe('награды', () => {
  const now = new Date(2026, 9, 7, 20, 0);

  it('+10 XP за запись и без дублей при повторном вызове', () => {
    const s = state({ meals: [meal('тарелка плова', new Date(2026, 9, 7, 13).toISOString())] });
    const first = collectRewards(s, now);
    expect(first.rewards.find((r) => r.kind === 'meal')?.xp).toBe(10);
    expect(first.progress.achievements).toContain('first_blood');
    const again = collectRewards({ ...s, progress: first.progress }, now);
    expect(again.rewards).toEqual([]);
  });

  it('лимит XP за записи в день', () => {
    const meals = Array.from({ length: 10 }, (_, i) => meal('яблоко', new Date(2026, 9, 7, 8 + i).toISOString()));
    const { rewards } = collectRewards(state({ meals }), now);
    expect(rewards.filter((r) => r.kind === 'meal')).toHaveLength(6);
  });

  it('шаги, сон, двойной XP и level-up', () => {
    const s = state({
      activity: { '2026-10-07': { date: '2026-10-07', steps: 9000, sleepHours: 7.5 } },
      progress: { ...EMPTY_PROGRESS, xp: 980, doubleXpDays: ['2026-10-07'] },
    });
    const r = collectRewards(s, now);
    expect(r.rewards.find((x) => x.key === 'steps:2026-10-07')?.xp).toBe(60);
    expect(r.rewards.find((x) => x.key === 'sleep:2026-10-07')?.xp).toBe(40);
    expect(r.levelUp).toBe(2);
  });

  it('монеты за серию — один раз на серию', () => {
    const meals = ['2026-10-05', '2026-10-06', '2026-10-07'].map((d) => meal('гречка', `${d}T09:00:00`));
    const first = collectRewards(state({ meals }), now);
    expect(first.rewards.some((r) => r.kind === 'streak')).toBe(true);
    const nextDay = collectRewards(state({ meals, progress: first.progress }), new Date(2026, 9, 8, 9));
    expect(nextDay.rewards.some((r) => r.kind === 'streak')).toBe(false);
  });
});

it('шаблоны: повторяющийся завтрак', () => {
  const meals = [
    meal('овсянка и банан', '2026-10-05T08:00:00'),
    meal('овсянка и банан', '2026-10-06T08:00:00'),
    meal('плов', '2026-10-06T13:00:00'),
  ];
  const t = topTemplates(meals);
  expect(t).toHaveLength(1);
  expect(t[0]).toMatchObject({ label: 'Овсянка + Банан', uses: 2 });
});

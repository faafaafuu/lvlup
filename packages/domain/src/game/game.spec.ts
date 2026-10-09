import { parseHeuristic, resolveMeal } from '../food';
import { MealLog, Profile, currentStreak, dailyCalorieTarget, minHealthyWeight, rescuableDay, smoothWeights, topTemplates } from './index';

const profile: Profile = { sex: 'male', age: 34, heightCm: 178, startWeightKg: 92, targetWeightKg: 80, activity: 'light', stepsGoal: 8000 };

let seq = 0;
function meal(text: string, at: string): MealLog {
  const draft = resolveMeal(text, parseHeuristic(text));
  return { id: `m${++seq}`, at, text, items: draft.items, totals: draft.totals };
}

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

  it('тренд веса сглаживает скачки и не отстаёт при редких взвешиваниях', () => {
    const noisy = [{ date: '2026-10-01', kg: 92 }, { date: '2026-10-02', kg: 92 }, { date: '2026-10-03', kg: 86 }];
    expect(smoothWeights(noisy).at(-1)!.trend).toBe(91.2);
    const sparse = [{ date: '2026-09-01', kg: 92 }, { date: '2026-09-15', kg: 89 }];
    expect(smoothWeights(sparse).at(-1)!.trend).toBeLessThan(89.5);
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

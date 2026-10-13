import { GameState, MealLog, Profile } from './types';
import { gameSummary, mealSlot } from './xp';

const profile: Profile = { sex: 'male', age: 34, heightCm: 178, startWeightKg: 92, targetWeightKg: 80, activity: 'light', stepsGoal: 8000 };
let n = 0;
const meal = (at: string, kcal = 400): MealLog => ({ id: `m${++n}`, at, text: '', items: [], totals: { kcal, protein: 0, fat: 0, carbs: 0 } });
const state = (p: Partial<GameState>): GameState => ({ profile, meals: [], activity: {}, weights: [], ...p });

describe('опыт и уровни', () => {
  it('25 XP за запись, лимит в день, шаги и достижение «первая запись»', () => {
    const meals = Array.from({ length: 10 }, (_, i) => meal(`2026-10-13T${String(9 + i).padStart(2, '0')}:00:00`));
    const s = gameSummary(state({ meals, activity: { '2026-10-13': { date: '2026-10-13', steps: 9000 } } }), new Date(2026, 9, 13, 20));
    // 8 записей × 25 + 50 за шаги + 100 за «первую запись»
    expect(s.xp).toBe(200 + 50 + 100);
    expect(s.level).toBe(1);
    expect(s.coins).toBe(5 + 20);
  });

  it('удалённая запись убирает опыт — всё считается из данных', () => {
    const one = gameSummary(state({ meals: [meal('2026-10-13T09:00:00')] }), new Date(2026, 9, 13, 20)).xp;
    const none = gameSummary(state({}), new Date(2026, 9, 13, 20)).xp;
    expect(one - none).toBe(25 + 100);
  });

  it('серия и прогресс достижения «7 дней подряд»', () => {
    const meals = ['10', '11', '12', '13'].map((d) => meal(`2026-10-${d}T09:00:00`));
    const s = gameSummary(state({ meals }), new Date(2026, 9, 13, 20));
    expect(s.streak).toBe(4);
    expect(s.achievements.find((a) => a.id === 'streak7')).toMatchObject({ done: false, progress: 4, target: 7 });
    expect(gameSummary(state({ meals }), new Date(2026, 9, 14, 9)).streak).toBe(4);
  });
});

it('приём пищи по времени', () => {
  expect(mealSlot('2026-10-13T08:40:00')).toBe('Завтрак');
  expect(mealSlot('2026-10-13T13:40:00')).toBe('Обед');
  expect(mealSlot('2026-10-13T16:20:00')).toBe('Перекус');
  expect(mealSlot('2026-10-13T19:30:00')).toBe('Ужин');
});

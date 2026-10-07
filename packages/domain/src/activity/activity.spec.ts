import { parseActivitiesHeuristic, parseHeuristic, resolveActivities, resolveMeal } from '../index';

const resolve = (text: string, kg = 90) => resolveActivities(parseActivitiesHeuristic(text), kg);

describe('активность голосом', () => {
  it('гантели 10 кг в течение часа', () => {
    const [a] = resolve('занимался спортом с гантелей 10 кг в течение часа');
    expect(a).toMatchObject({ activityId: 'strength', minutes: 60, weightKg: 10, assumed: false, kcal: 450 });
  });

  it('полчаса, полтора часа, минуты', () => {
    expect(resolve('пробежал полчаса')[0]).toMatchObject({ activityId: 'running', minutes: 30 });
    expect(resolve('полтора часа футбол')[0]).toMatchObject({ activityId: 'team_sport', minutes: 90 });
    expect(resolve('йога 40 минут')[0]).toMatchObject({ activityId: 'yoga', minutes: 40 });
  });

  it('повторения без времени', () => {
    expect(resolve('сделал 40 отжиманий')[0]).toMatchObject({ activityId: 'pushups', reps: 40, minutes: 2 });
  });

  it('без длительности — по умолчанию и помечено как угаданное', () => {
    expect(resolve('сходил в зал')[0]).toMatchObject({ activityId: 'strength', minutes: 45, assumed: true });
  });

  it('еда и спорт в одной фразе, вес гантелей не уходит в еду', () => {
    const text = 'потренировался с гантелями 10 кг час, потом съел гречку';
    const draft = resolveMeal(text, parseHeuristic(text), { activities: parseActivitiesHeuristic(text), bodyWeightKg: 90 });
    expect(draft.items.map((i) => [i.foodId, i.grams])).toEqual([['buckwheat', 200]]);
    expect(draft.activities.map((a) => [a.activityId, a.minutes])).toEqual([['strength', 60]]);
  });

  it('в фразе про еду активности нет', () => {
    expect(parseActivitiesHeuristic('тарелка плова и чай с сахаром')).toEqual([]);
  });
});

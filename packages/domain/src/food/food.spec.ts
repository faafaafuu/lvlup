import { answerQuestion, parseHeuristic, resolveMeal, setItemGrams, stem } from './index';

function parse(text: string, portions = {}) {
  return resolveMeal(text, parseHeuristic(text), { portions });
}

describe('stem', () => {
  it('сводит падежи к одной основе', () => {
    expect(stem('плова')).toBe(stem('плов'));
    expect(stem('шоколадки')).toBe(stem('шоколадка'));
    expect(stem('чая')).toBe(stem('чай'));
    expect(stem('колбасой')).toBe(stem('колбаса'));
  });
});

describe('разбор фразы из ТЗ', () => {
  const draft = parse('Я съел тарелку плова, два бутерброда с колбасой и кусочек шоколадки');

  it('находит три позиции с количеством', () => {
    expect(draft.items.map((i) => [i.foodId, i.quantity, i.unit])).toEqual([
      ['plov', 1, 'plate'],
      ['sandwich_sausage', 2, 'piece'],
      ['chocolate', 1, 'slice'],
    ]);
  });

  it('считает калории по базе, а не наугад', () => {
    // плов 300 г × 180 + 2 бутерброда × 80 г × 290 + 10 г шоколада × 540
    expect(draft.totals.kcal).toBe(540 + 464 + 54);
  });

  it('не задаёт вопрос, если порция названа', () => {
    expect(draft.questions).toEqual([]);
  });
});

describe('количества и единицы', () => {
  it('граммы до и после блюда', () => {
    expect(parse('200 грамм гречки').items[0]).toMatchObject({ foodId: 'buckwheat', grams: 200, assumed: false });
    expect(parse('гречки граммов 150 и котлету').items.map((i) => i.grams)).toEqual([150, 90]);
  });

  it('пол-тарелки, полторы, словами', () => {
    expect(parse('полтарелки борща').items[0]).toMatchObject({ foodId: 'borsch', quantity: 0.5, grams: 175 });
    expect(parse('полторы тарелки плова').items[0]!.grams).toBe(450);
    expect(parse('три сырника').items[0]).toMatchObject({ foodId: 'syrniki', quantity: 3, grams: 150 });
  });

  it('литры и чайная ложка', () => {
    expect(parse('выпил пол литра кефира').items[0]).toMatchObject({ foodId: 'kefir', grams: 500 });
    expect(parse('кофе с одной чайной ложкой сахара').items.map((i) => [i.foodId, i.unit])).toEqual([
      ['coffee', 'cup'],
      ['sugar', 'tsp'],
    ]);
  });

  it('длинное название побеждает короткое', () => {
    expect(parse('чай с сахаром').items.map((i) => i.foodId)).toEqual(['tea_sugar']);
  });
});

describe('ленивый режим', () => {
  it('моя тарелка перекрывает стандартную', () => {
    expect(parse('тарелка плова', { units: { plate: 400 } }).items[0]!.grams).toBe(400);
  });

  it('мой бутерброд перекрывает стандартный', () => {
    expect(parse('два бутерброда с колбасой', { foods: { sandwich_sausage: 60 } }).items[0]!.grams).toBe(120);
  });
});

describe('уточняющие вопросы', () => {
  it('спрашивает про шоколадку без количества', () => {
    const draft = parse('съел шоколадку');
    expect(draft.questions).toHaveLength(1);
    expect(draft.questions[0]!.options.map((o) => o.label)).toContain('Вся плитка');
  });

  it('не больше двух вопросов, самые дорогие первыми', () => {
    const draft = parse('пицца чипсы шоколад и орехи');
    expect(draft.questions).toHaveLength(2);
    expect(draft.questions[0]!.text).toMatch(/Пицца/);
  });

  it('ответ подставляет порцию и убирает вопрос', () => {
    const draft = parse('шоколадка');
    const answered = answerQuestion(draft, draft.questions[0]!.id, 3);
    expect(answered.items[0]!.grams).toBe(90);
    expect(answered.questions).toEqual([]);
    expect(answered.totals.kcal).toBe(486);
  });
});

it('правка граммов пересчитывает итог', () => {
  const draft = setItemGrams(parse('тарелка гречки'), 0, 100);
  expect(draft.totals.kcal).toBe(110);
});

it('незнакомое блюдо от LLM попадает в unknown', () => {
  const draft = resolveMeal('чучвара', [{ text: 'чучвара', quantity: 1 }]);
  expect(draft.unknown).toEqual(['чучвара']);
});

describe('количество принадлежит своей части фразы', () => {
  const ids = (text: string) => parse(text).items.map((i) => [i.foodId, i.quantity, i.unit]);

  it('количество после блюда не уходит к соседу', () => {
    expect(ids('Съел макароны две тарелки и выпил 3 пива')).toEqual([
      ['pasta', 2, 'plate'],
      ['beer', 3, 'bottle'],
    ]);
  });

  it('запятые и глаголы делят фразу', () => {
    expect(ids('пиво две банки, макароны тарелку')).toEqual([
      ['beer', 2, 'can'],
      ['pasta', 1, 'plate'],
    ]);
    expect(ids('выпил 3 пива потом съел макароны')).toEqual([
      ['beer', 3, 'bottle'],
      ['pasta', 1, 'plate'],
    ]);
  });

  it('первое число важнее уточнений', () => {
    expect(ids('2 бутылки пива по 0,5 и макароны')[0]).toEqual(['beer', 2, 'bottle']);
  });
});

import { UnitId } from './types';

/** Граммы на единицу по умолчанию, если у блюда нет своей. */
export const UNIT_GRAMS: Record<UnitId, number> = {
  g: 1,
  ml: 1,
  piece: 100,
  plate: 300,
  bowl: 350,
  serving: 250,
  slice: 30,
  glass: 250,
  cup: 300,
  tbsp: 15,
  tsp: 5,
  handful: 30,
  pack: 200,
  bottle: 500,
  can: 330,
  bar: 100,
  square: 5,
};

/** Основы слов → единица. Сравниваются со стеммированными токенами. */
export const UNIT_WORDS: Array<[string, UnitId]> = [
  ['грамм', 'g'], ['гр', 'g'], ['г', 'g'], ['килограмм', 'g'], ['кг', 'g'],
  ['миллилитр', 'ml'], ['мл', 'ml'], ['литр', 'ml'], ['л', 'ml'],
  ['штук', 'piece'], ['шт', 'piece'], ['штучк', 'piece'],
  ['тарелк', 'plate'], ['тарелочк', 'plate'],
  ['миск', 'bowl'], ['чашк', 'cup'], ['кружк', 'cup'],
  ['порци', 'serving'], ['порцию', 'serving'],
  ['кус', 'slice'], ['кусок', 'slice'], ['кусочек', 'slice'], ['кусочк', 'slice'], ['ломтик', 'slice'], ['ломот', 'slice'],
  ['стакан', 'glass'], ['стаканчик', 'glass'],
  ['ложк', 'tbsp'], ['столов', 'tbsp'], ['чайн', 'tsp'],
  ['горст', 'handful'], ['горсточк', 'handful'],
  ['пачк', 'pack'], ['упаковк', 'pack'],
  ['бутылк', 'bottle'], ['бутылочк', 'bottle'],
  ['банк', 'can'], ['баночк', 'can'],
  ['плитк', 'bar'], ['батончик', 'piece'],
  ['квадратик', 'square'], ['долечк', 'square'], ['дольк', 'square'],
];

/** Множитель для «кг» и «литр»: остальное считается в г/мл как есть. */
export const UNIT_SCALE: Record<string, number> = { килограмм: 1000, кг: 1000, литр: 1000, л: 1000 };

export const UNIT_LABELS: Record<UnitId, string> = {
  g: 'г', ml: 'мл', piece: 'шт', plate: 'тарелка', bowl: 'миска', serving: 'порция',
  slice: 'кусок', glass: 'стакан', cup: 'кружка', tbsp: 'ст. ложка', tsp: 'ч. ложка',
  handful: 'горсть', pack: 'пачка', bottle: 'бутылка', can: 'банка', bar: 'плитка', square: 'квадратик',
};

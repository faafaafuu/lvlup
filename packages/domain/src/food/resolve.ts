import { ParsedActivity } from '../activity/types';
import { resolveActivities } from '../activity/parse';
import { CATALOG, CATALOG_BY_ID } from './catalog';
import { matchFood } from './match';
import { UNIT_GRAMS, UNIT_LABELS } from './units';
import { ClarifyQuestion, Food, MealDraft, Nutrients, ParsedEntity, ResolvedItem, UnitId, UserPortions } from './types';

/** Посуда, размер которой у каждого свой — её перекрывают настройки «ленивого режима». */
const PERSONAL_UNITS: ReadonlySet<UnitId> = new Set(['plate', 'bowl', 'cup', 'glass', 'tbsp', 'tsp']);

/** Спрашиваем, только если трактовки расходятся хотя бы на столько ккал. */
export const CLARIFY_MIN_SPREAD_KCAL = 150;
export const MAX_QUESTIONS = 2;

export interface ResolveOptions {
  portions?: UserPortions;
  catalog?: readonly Food[];
  activities?: ParsedActivity[];
  /** Для расчёта сожжённых калорий. */
  bodyWeightKg?: number;
}

/** Сущности от LLM/офлайн-разбора → черновик записи с калориями и вопросами. */
export function resolveMeal(sourceText: string, entities: ParsedEntity[], options: ResolveOptions = {}): MealDraft {
  const catalog = options.catalog ?? CATALOG;
  const byId = catalog === CATALOG ? CATALOG_BY_ID : new Map(catalog.map((f) => [f.id, f]));
  const items: ResolvedItem[] = [];
  const unknown: string[] = [];

  for (const entity of entities) {
    const food = (entity.foodId ? byId.get(entity.foodId) : undefined) ?? matchFood(entity.text, catalog);
    if (!food) {
      unknown.push(entity.text);
      continue;
    }
    items.push(resolveItem(food, entity, options.portions));
  }

  const activities = resolveActivities(options.activities ?? [], options.bodyWeightKg ?? 75);
  const draft: MealDraft = { sourceText, items, activities, unknown, questions: [], totals: sumNutrients(items) };
  draft.questions = buildQuestions(draft, byId);
  return draft;
}

export function resolveItem(food: Food, entity: ParsedEntity, portions: UserPortions = {}): ResolvedItem {
  const assumed = entity.grams == null && entity.quantity == null && entity.unit == null;

  if (entity.grams != null && entity.grams > 0) {
    const unit = entity.unit === 'ml' ? 'ml' : 'g';
    return makeItem(food, entity.text, entity.grams, unit, entity.grams, false);
  }

  const unit = entity.unit ?? food.defaultUnit;
  const quantity = entity.quantity && entity.quantity > 0 ? entity.quantity : 1;
  const grams = Math.round(quantity * gramsPerUnit(food, unit, portions));
  return makeItem(food, entity.text, quantity, unit, grams, assumed);
}

export function gramsPerUnit(food: Food, unit: UnitId, portions: UserPortions = {}): number {
  const ownFood = portions.foods?.[food.id];
  if (ownFood != null && unit === food.defaultUnit) return ownFood;
  const ownUnit = portions.units?.[unit];
  if (ownUnit != null && PERSONAL_UNITS.has(unit)) return ownUnit;
  return food.units?.[unit] ?? UNIT_GRAMS[unit];
}

export function nutrientsFor(food: Food, grams: number): Nutrients {
  const k = grams / 100;
  return {
    kcal: Math.round(food.per100g.kcal * k),
    protein: round1(food.per100g.protein * k),
    fat: round1(food.per100g.fat * k),
    carbs: round1(food.per100g.carbs * k),
  };
}

function makeItem(food: Food, text: string, quantity: number, unit: UnitId, grams: number, assumed: boolean): ResolvedItem {
  return { foodId: food.id, name: food.name, text, quantity, unit, grams, assumed, nutrients: nutrientsFor(food, grams) };
}

function buildQuestions(draft: MealDraft, byId: ReadonlyMap<string, Food>): ClarifyQuestion[] {
  const candidates: Array<{ question: ClarifyQuestion; spread: number }> = [];

  draft.items.forEach((item, itemIndex) => {
    const food = byId.get(item.foodId);
    if (!item.assumed || !food?.portionOptions?.length) return;
    const options = food.portionOptions.map((o) => ({ ...o, kcal: nutrientsFor(food, o.grams).kcal }));
    const kcals = options.map((o) => o.kcal);
    const spread = Math.max(...kcals) - Math.min(...kcals);
    if (spread < CLARIFY_MIN_SPREAD_KCAL) return;
    const defaultIndex = closestIndex(options.map((o) => o.grams), item.grams);
    candidates.push({
      spread,
      question: { id: `portion:${itemIndex}`, itemIndex, text: `${food.name} — сколько?`, options, defaultIndex },
    });
  });

  return candidates
    .sort((a, b) => b.spread - a.spread)
    .slice(0, MAX_QUESTIONS)
    .map((c) => c.question);
}

/** Ответ на уточняющий вопрос: подставляем выбранную порцию и убираем вопрос. */
export function answerQuestion(draft: MealDraft, questionId: string, optionIndex: number): MealDraft {
  const question = draft.questions.find((q) => q.id === questionId);
  const option = question?.options[optionIndex];
  if (!question || !option) return draft;
  const next = setItemGrams(draft, question.itemIndex, option.grams);
  return { ...next, questions: draft.questions.filter((q) => q.id !== questionId) };
}

/** Ручная правка граммов (степпер ±). Блюдо ищем по id, поэтому каталог не нужен снаружи. */
export function setItemGrams(draft: MealDraft, itemIndex: number, grams: number, catalog: readonly Food[] = CATALOG): MealDraft {
  const item = draft.items[itemIndex];
  const food = item && (CATALOG_BY_ID.get(item.foodId) ?? catalog.find((f) => f.id === item.foodId));
  if (!item || !food) return draft;
  const safeGrams = Math.max(1, Math.round(grams));
  const unit: UnitId = item.unit === 'ml' || food.tags?.includes('drink') ? 'ml' : 'g';
  const updated: ResolvedItem = { ...item, quantity: safeGrams, unit, grams: safeGrams, assumed: false, nutrients: nutrientsFor(food, safeGrams) };
  const items = draft.items.map((it, i) => (i === itemIndex ? updated : it));
  return { ...draft, items, totals: sumNutrients(items) };
}

export function removeItem(draft: MealDraft, itemIndex: number): MealDraft {
  const items = draft.items.filter((_, i) => i !== itemIndex);
  const questions = draft.questions
    .filter((q) => q.itemIndex !== itemIndex)
    .map((q) => (q.itemIndex > itemIndex ? { ...q, itemIndex: q.itemIndex - 1, id: `portion:${q.itemIndex - 1}` } : q));
  return { ...draft, items, questions, totals: sumNutrients(items) };
}

export function sumNutrients(items: Array<{ nutrients: Nutrients }>): Nutrients {
  const total = items.reduce(
    (acc, { nutrients: n }) => ({ kcal: acc.kcal + n.kcal, protein: acc.protein + n.protein, fat: acc.fat + n.fat, carbs: acc.carbs + n.carbs }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
  return { kcal: total.kcal, protein: round1(total.protein), fat: round1(total.fat), carbs: round1(total.carbs) };
}

/** «1 тарелка · 300 г», «200 г». */
export function describePortion(item: ResolvedItem): string {
  if (item.unit === 'g' || item.unit === 'ml') return `${item.grams} ${UNIT_LABELS[item.unit]}`;
  const qty = Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1).replace('.', ',');
  return `${qty} ${UNIT_LABELS[item.unit]} · ${item.grams} г`;
}

function closestIndex(values: number[], target: number): number {
  let best = 0;
  values.forEach((v, i) => {
    if (Math.abs(v - target) < Math.abs(values[best]! - target)) best = i;
  });
  return best;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

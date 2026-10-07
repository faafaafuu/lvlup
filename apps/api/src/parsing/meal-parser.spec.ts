import { Extraction } from './extractors/schema';
import { FoodExtractor } from './extractors/extractor';
import { MealParser } from './meal-parser';

class FakeExtractor implements FoodExtractor {
  readonly name = 'fake';
  constructor(private readonly impl: (text: string, signal: AbortSignal) => Promise<Extraction>) {}
  extract(text: string, signal: AbortSignal) {
    return this.impl(text, signal);
  }
}

describe('MealParser', () => {
  it('калории считает резолвер из сущностей LLM', async () => {
    const parser = new MealParser(new FakeExtractor(async () => ({ items: [{ text: 'плов', foodId: 'plov', quantity: 1, unit: 'plate', grams: null }], activities: [] })), 1000);
    const result = await parser.parse('тарелка плова', { units: { plate: 400 } });
    expect(result).toMatchObject({ parser: 'fake', fallback: false });
    expect(result.draft.totals.kcal).toBe(720);
  });

  it('при ошибке LLM падает в офлайн-разбор', async () => {
    const parser = new MealParser(new FakeExtractor(async () => { throw new Error('503'); }), 1000);
    const result = await parser.parse('два бутерброда с колбасой');
    expect(result).toMatchObject({ parser: 'heuristic', fallback: true, error: '503' });
    expect(result.draft.items[0]).toMatchObject({ foodId: 'sandwich_sausage', quantity: 2 });
  });

  it('не ждёт LLM дольше таймаута', async () => {
    const slow = new FakeExtractor(
      (_t, signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')))),
    );
    const result = await new MealParser(slow, 50).parse('банан');
    expect(result.fallback).toBe(true);
    expect(result.latencyMs).toBeLessThan(1000);
  });
});

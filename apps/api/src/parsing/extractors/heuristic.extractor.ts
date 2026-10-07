import { parseActivitiesHeuristic, parseHeuristic } from '@levelup/domain';
import { FoodExtractor } from './extractor';
import { Extraction } from './schema';

export class HeuristicExtractor implements FoodExtractor {
  readonly name = 'heuristic';

  async extract(text: string): Promise<Extraction> {
    const items = parseHeuristic(text).map((e) => ({ text: e.text, foodId: e.foodId ?? null, quantity: e.quantity ?? null, unit: e.unit ?? null, grams: e.grams ?? null }));
    const activities = parseActivitiesHeuristic(text).map((a) => ({
      text: a.text, activityId: a.activityId ?? null, minutes: a.minutes ?? null, reps: a.reps ?? null, weightKg: a.weightKg ?? null,
    }));
    return { items, activities } as Extraction;
  }
}

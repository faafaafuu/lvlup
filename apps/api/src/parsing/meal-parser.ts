import { CATALOG_BY_ID, MealDraft, ParsedEntity, UserPortions, resolveMeal, stem, tokenize } from '@levelup/domain';
import { FoodExtractor, HeuristicExtractor } from './extractors';

export interface ParseResult {
  draft: MealDraft;
  /** Кто реально разобрал фразу. */
  parser: string;
  /** true — основная LLM упала или не успела, сработал офлайн-разбор. */
  fallback: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Разбор фразы: LLM с жёстким таймаутом, при любой ошибке — офлайн-разбор.
 * Пользователь не должен ждать дольше LLM_TIMEOUT_MS и никогда не получает пустой экран из-за сети.
 */
export class MealParser {
  private readonly heuristic = new HeuristicExtractor();

  constructor(private readonly primary: FoodExtractor, private readonly timeoutMs: number) {}

  async parse(text: string, portions?: UserPortions, bodyWeightKg?: number): Promise<ParseResult> {
    const started = Date.now();
    const clean = text.trim().slice(0, 500);
    try {
      const x = await this.primary.extract(clean, AbortSignal.timeout(this.timeoutMs));
      const items = this.primary.name === this.heuristic.name ? x.items : withMissed(x.items, (await this.heuristic.extract(clean)).items);
      return { draft: resolveMeal(clean, items, { portions, activities: x.activities, bodyWeightKg }), parser: this.primary.name, fallback: false, latencyMs: Date.now() - started };
    } catch (err) {
      const x = await this.heuristic.extract(clean);
      return {
        draft: resolveMeal(clean, x.items, { portions, activities: x.activities, bodyWeightKg }),
        parser: this.heuristic.name,
        fallback: this.primary.name !== this.heuristic.name,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/**
 * LLM иногда «съедает» добавки («борщ со сметаной» → только борщ), а словарь их видит.
 * Добавляем из словаря блюда, которых у LLM нет и которые не являются вариантом её блюд
 * (котлета ≈ куриная котлета — общие слова в названиях; сметана ≠ борщ).
 */
export function withMissed(llm: ParsedEntity[], dict: ParsedEntity[]): ParsedEntity[] {
  const foodStems = (id: string | null | undefined) => {
    const food = id ? CATALOG_BY_ID.get(id) : undefined;
    return new Set((food?.aliases ?? []).flatMap((a) => tokenize(a).map(stem)).filter((w) => w.length > 2));
  };
  const ids = new Set(llm.map((e) => e.foodId).filter(Boolean));
  const llmStems = new Set(llm.flatMap((e) => [...foodStems(e.foodId)]));
  const extra = dict.filter((d) => d.foodId && !ids.has(d.foodId) && ![...foodStems(d.foodId)].some((w) => llmStems.has(w)));
  return [...llm, ...extra];
}

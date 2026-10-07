import { MealDraft, UserPortions, resolveMeal } from '@levelup/domain';
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

  async parse(text: string, portions?: UserPortions): Promise<ParseResult> {
    const started = Date.now();
    const clean = text.trim().slice(0, 500);
    try {
      const entities = await this.primary.extract(clean, AbortSignal.timeout(this.timeoutMs));
      return { draft: resolveMeal(clean, entities, { portions }), parser: this.primary.name, fallback: false, latencyMs: Date.now() - started };
    } catch (err) {
      const entities = await this.heuristic.extract(clean);
      return {
        draft: resolveMeal(clean, entities, { portions }),
        parser: this.heuristic.name,
        fallback: this.primary.name !== this.heuristic.name,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

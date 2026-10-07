import { ParsedEntity, parseHeuristic } from '@levelup/domain';
import { FoodExtractor } from './extractor';

export class HeuristicExtractor implements FoodExtractor {
  readonly name = 'heuristic';

  async extract(text: string): Promise<ParsedEntity[]> {
    return parseHeuristic(text);
  }
}

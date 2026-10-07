import { AppConfig, ExtractorName } from '../../config';
import { AnthropicExtractor } from './anthropic.extractor';
import { FoodExtractor } from './extractor';
import { HeuristicExtractor } from './heuristic.extractor';
import { OllamaExtractor } from './ollama.extractor';
import { OpenAiExtractor } from './openai.extractor';

export type { FoodExtractor } from './extractor';
export { HeuristicExtractor } from './heuristic.extractor';

export function createExtractor(name: ExtractorName, config: AppConfig): FoodExtractor {
  switch (name) {
    case 'anthropic':
      return new AnthropicExtractor(config.anthropic.apiKey, config.anthropic.model);
    case 'openai':
      if (!config.openai.apiKey) throw new Error('OPENAI_API_KEY не задан');
      return new OpenAiExtractor(config.openai.apiKey, config.openai.model, config.openai.baseUrl);
    case 'ollama':
      return new OllamaExtractor(config.ollama.baseUrl, config.ollama.model);
    case 'heuristic':
      return new HeuristicExtractor();
  }
}

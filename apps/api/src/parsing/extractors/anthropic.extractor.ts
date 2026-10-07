import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ParsedEntity } from '@levelup/domain';
import { FoodExtractor } from './extractor';
import { SYSTEM_PROMPT } from './prompt';
import { ExtractionSchema } from './schema';

export class AnthropicExtractor implements FoodExtractor {
  readonly name = 'anthropic';
  private readonly client: Anthropic;

  constructor(apiKey: string | null, private readonly model: string) {
    // Без ключа SDK сам ищет ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / профиль `ant auth login`.
    this.client = new Anthropic({ ...(apiKey ? { apiKey } : {}), maxRetries: 1 });
  }

  async extract(text: string, signal: AbortSignal): Promise<ParsedEntity[]> {
    const response = await this.client.messages.parse(
      {
        model: this.model,
        max_tokens: 1024,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: text }],
        output_config: { format: zodOutputFormat(ExtractionSchema) },
      },
      { signal },
    );
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      throw new Error(`Anthropic не вернул разбор (stop_reason=${response.stop_reason})`);
    }
    return response.parsed_output.items;
  }
}

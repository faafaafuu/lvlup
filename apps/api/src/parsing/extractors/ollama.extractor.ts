import { FoodExtractor } from './extractor';
import { SYSTEM_PROMPT } from './prompt';
import { EXTRACTION_JSON_SCHEMA, Extraction, ExtractionSchema } from './schema';

/** Локальная модель через Ollama: бесплатно, но на CPU обычно медленнее 3 секунд. */
export class OllamaExtractor implements FoodExtractor {
  readonly name = 'ollama';

  constructor(private readonly baseUrl: string, private readonly model: string) {}

  async extract(text: string, signal: AbortSignal): Promise<Extraction> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: EXTRACTION_JSON_SCHEMA,
        options: { temperature: 0 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { message: { content: string } };
    return ExtractionSchema.parse(JSON.parse(body.message.content));
  }
}

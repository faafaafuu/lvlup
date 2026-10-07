import { FoodExtractor } from './extractor';
import { SYSTEM_PROMPT } from './prompt';
import { EXTRACTION_JSON_SCHEMA, Extraction, ExtractionSchema } from './schema';

/** OpenAI-совместимый Chat Completions (gpt-4o-mini и аналоги) с JSON Schema на выходе. */
export class OpenAiExtractor implements FoodExtractor {
  readonly name = 'openai';

  constructor(private readonly apiKey: string, private readonly model: string, private readonly baseUrl: string) {}

  async extract(text: string, signal: AbortSignal): Promise<Extraction> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'meal', strict: true, schema: EXTRACTION_JSON_SCHEMA } },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return ExtractionSchema.parse(JSON.parse(body.choices[0]?.message.content ?? '{}'));
  }
}

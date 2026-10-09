import { FoodExtractor } from './extractor';
import { SYSTEM_PROMPT } from './prompt';
import { EXTRACTION_JSON_SCHEMA, Extraction, ExtractionSchema } from './schema';

/**
 * Любой OpenAI-совместимый API: OpenAI, OpenRouter, DeepSeek, Groq, Gemini.
 * Сначала просим строгую JSON-схему; если провайдер/модель её не поддерживает —
 * обычный JSON-режим со схемой в промпте и проверкой через zod.
 */
export class OpenAiExtractor implements FoodExtractor {
  readonly name = 'openai';
  private strictSupported = true;

  constructor(private readonly apiKey: string, private readonly model: string, private readonly baseUrl: string) {}

  async extract(text: string, signal: AbortSignal): Promise<Extraction> {
    try {
      return await this.once(text, signal);
    } catch (e) {
      // Оборванный или пустой JSON случается у дешёвых моделей — один повтор почти всегда спасает.
      if (e instanceof SyntaxError && !signal.aborted) return this.once(text, signal);
      throw e;
    }
  }

  private async once(text: string, signal: AbortSignal): Promise<Extraction> {
    if (this.strictSupported) {
      const res = await this.call(text, signal, true);
      if (res.ok) return this.parse(res.body);
      // 400 про response_format — модель не умеет строгую схему, переходим на json_object навсегда.
      if (res.status === 400 && /response_format|json_schema|structured/i.test(res.body)) this.strictSupported = false;
      else throw new Error(`LLM ${res.status}: ${res.body.slice(0, 300)}`);
    }
    const res = await this.call(text, signal, false);
    if (!res.ok) throw new Error(`LLM ${res.status}: ${res.body.slice(0, 300)}`);
    return this.parse(res.body);
  }

  private async call(text: string, signal: AbortSignal, strict: boolean): Promise<{ ok: boolean; status: number; body: string }> {
    const { $schema: _drop, ...schema } = EXTRACTION_JSON_SCHEMA as Record<string, unknown>;
    const system = strict
      ? SYSTEM_PROMPT
      : `${SYSTEM_PROMPT}\n\nОтветь ТОЛЬКО JSON-объектом по этой JSON Schema, без пояснений:\n${JSON.stringify(schema)}`;
    const res = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
        // OpenRouter показывает это в своей статистике; остальным провайдерам не мешает.
        'x-title': 'Level Up',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: 800,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
        response_format: strict ? { type: 'json_schema', json_schema: { name: 'meal', strict: true, schema } } : { type: 'json_object' },
        // «Думающие» модели (DeepSeek V4 и др.) иначе тратят секунды и токены на рассуждения,
        // а для извлечения сущностей они не нужны. OpenRouter понимает этот параметр, остальные игнорируют.
        // Маршрутизация OpenRouter: самый быстрый провайдер; AtlasCloud игнорирует отключение
        // рассуждений и сжигает все токены на «размышления» — его не используем.
        ...(this.baseUrl.includes('openrouter')
          ? { reasoning: { enabled: false }, provider: { sort: 'latency', ignore: ['AtlasCloud'] } }
          : {}),
      }),
    });
    return { ok: res.ok, status: res.status, body: await res.text() };
  }

  private parse(body: string): Extraction {
    const data = JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> };
    const content = (data.choices?.[0]?.message?.content ?? '{}').replace(/^```(?:json)?\s*|\s*```$/g, '');
    const parsed = JSON.parse(content) as Partial<Extraction>;
    return ExtractionSchema.parse({ items: parsed.items ?? [], activities: parsed.activities ?? [] });
  }
}

export type ExtractorName = 'anthropic' | 'openai' | 'ollama' | 'heuristic';

export interface AppConfig {
  port: number;
  /** Если задан — все запросы должны нести заголовок x-api-key с этим значением. */
  apiToken: string | null;
  extractor: ExtractorName;
  llmTimeoutMs: number;
  anthropic: { apiKey: string | null; model: string };
  openai: { apiKey: string | null; model: string; baseUrl: string };
  ollama: { baseUrl: string; model: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 3100),
    apiToken: env.API_TOKEN || null,
    extractor: (env.EXTRACTOR as ExtractorName) || 'anthropic',
    llmTimeoutMs: Number(env.LLM_TIMEOUT_MS ?? 5000),
    anthropic: { apiKey: env.ANTHROPIC_API_KEY || null, model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5' },
    openai: {
      apiKey: env.OPENAI_API_KEY || null,
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    },
    ollama: { baseUrl: env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434', model: env.OLLAMA_MODEL || 'qwen2.5:3b' },
  };
}

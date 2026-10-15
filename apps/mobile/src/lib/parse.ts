import { MealDraft, UserPortions, parseActivitiesHeuristic, parseHeuristic, resolveMeal } from '@levelup/domain';
import { Settings } from '@/state/store';

export interface PhraseResult {
  draft: MealDraft;
  source: 'server' | 'offline';
  /** Сервер был настроен, но не ответил — фразу стоит разобрать позже. */
  serverFailed: boolean;
}

const SERVER_TIMEOUT_MS = 10000;

/**
 * Сервер разбора по умолчанию — чтобы после установки фразы сразу понимала модель,
 * а не офлайн-словарь. Токен вшивает сборка из секрета HRUM_API_TOKEN (в репозитории
 * его нет); свой адрес/токен из профиля или ссылки levelup://connect важнее.
 */
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || 'http://84.247.166.53:3100';
const DEFAULT_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN || '';

export function serverOf(settings: Settings): { url: string; token: string } {
  const own = settings.apiUrl.trim();
  if (own) return { url: own.replace(/\/+$/, ''), token: settings.apiToken };
  return { url: DEFAULT_URL, token: DEFAULT_TOKEN };
}

/**
 * Сначала сервер (LLM понимает разговорную речь лучше), при любой ошибке — офлайн-разбор
 * прямо на телефоне. Пользователь никогда не остаётся с пустым экраном из-за сети.
 */
export async function parsePhrase(text: string, settings: Settings, portions: UserPortions, bodyWeightKg: number): Promise<PhraseResult> {
  const offline = () => resolveMeal(text, parseHeuristic(text), { portions, activities: parseActivitiesHeuristic(text), bodyWeightKg });
  const server = serverOf(settings);
  if (!server.token) return { draft: offline(), source: 'offline', serverFailed: false };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);
    const res = await fetch(`${server.url}/v1/meals/parse`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': server.token },
      body: JSON.stringify({ text, portions, bodyWeightKg }),
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { draft: MealDraft };
    // Старый сервер без активностей — дополним офлайн-разбором.
    if (!body.draft.activities) body.draft.activities = offline().activities;
    return { draft: body.draft, source: 'server', serverFailed: false };
  } catch {
    return { draft: offline(), source: 'offline', serverFailed: true };
  }
}

export async function checkServer(settings: Settings): Promise<string> {
  try {
    const server = serverOf(settings);
    const res = await fetch(`${server.url}/v1/meals/parse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': server.token },
      body: JSON.stringify({ text: 'банан' }),
    });
    if (res.status === 401) return 'Сервер отвечает, но токен неверный';
    if (!res.ok) return `Сервер ответил ошибкой ${res.status}`;
    const body = (await res.json()) as { parser: string; latencyMs: number };
    return `Работает: ${body.parser}, ${body.latencyMs} мс`;
  } catch (e) {
    return `Не достучался: ${e instanceof Error ? e.message : e}`;
  }
}

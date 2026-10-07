import { CATALOG } from './catalog';
import { findFoods } from './match';
import { splitHalfPrefix, stem, tokenize, wordToNumber } from './text';
import { UNIT_SCALE, UNIT_WORDS } from './units';
import { Food, ParsedEntity, UnitId } from './types';

/**
 * Офлайн-разбор без LLM: находит блюда из каталога и смотрит на слова перед ними
 * («два», «тарелку», «200 г»). Работает на телефоне без сети и служит запасным
 * вариантом, если LLM недоступна или долго отвечает.
 */
export function parseHeuristic(text: string, catalog: readonly Food[] = CATALOG): ParsedEntity[] {
  const tokens = splitHalfPrefix(tokenize(text));
  const matches = findFoods(tokens, catalog);

  // Токены, которые уже забрало предыдущее блюдо («гречки граммов 150 | и котлету»).
  let consumedUntil = 0;

  return matches.map((match, i) => {
    const prevEnd = Math.max(consumedUntil, i === 0 ? 0 : matches[i - 1]!.end);
    const nextStart = i + 1 < matches.length ? matches[i + 1]!.start : tokens.length;
    const before = readAmount(tokens.slice(prevEnd, match.start));
    // «плов граммов 300» — вес после блюда берём, только если там явно г/мл.
    const after = readAmount(tokens.slice(match.end, nextStart));
    let amount = before;
    consumedUntil = match.end;
    if (before.quantity == null && before.unit == null && after.grams != null) {
      amount = after;
      consumedUntil = match.end + after.lastIndex + 1;
    }

    return {
      text: tokens.slice(match.start, match.end).join(' '),
      foodId: match.food.id,
      quantity: amount.quantity,
      unit: amount.unit,
      grams: amount.grams,
    };
  });
}

interface Amount {
  quantity: number | null;
  unit: UnitId | null;
  grams: number | null;
  /** Индекс последнего токена окна, который ушёл в количество или единицу (-1 — ни одного). */
  lastIndex: number;
}

export function readAmount(window: string[]): Amount {
  let quantity: number | null = null;
  let unit: UnitId | null = null;
  let scale = 1;
  let lastIndex = -1;

  window.forEach((token, index) => {
    const n = wordToNumber(token);
    if (n != null) {
      lastIndex = index;
      // «двести пятьдесят» → 250, «пол» перед числом не бывает, просто складываем разряды.
      quantity = quantity != null && quantity >= 20 && n < quantity ? quantity + n : n;
      return;
    }
    const tokenStem = stem(token);
    for (const [word, unitId] of UNIT_WORDS) {
      const hit = word.length <= 2 ? token === word : tokenStem.startsWith(word) || token.startsWith(word);
      if (!hit) continue;
      // «чайную ложку»: чайная побеждает следующую за ней «ложку».
      if (!(unit === 'tsp' && unitId === 'tbsp')) unit = unitId;
      scale = UNIT_SCALE[token] ?? UNIT_SCALE[word] ?? scale;
      lastIndex = index;
      break;
    }
  });

  if (unit === 'g' || unit === 'ml') {
    // «пол литра» без числа — это 0.5 л, а «литр кефира» — 1 л.
    const base = quantity ?? (scale > 1 ? 1 : null);
    return { quantity: null, unit, grams: base != null ? base * scale : null, lastIndex };
  }
  return { quantity, unit, grams: null, lastIndex };
}


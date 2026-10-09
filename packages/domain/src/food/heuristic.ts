import { findActivities } from '../activity/parse';
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
  const tokens = splitHalfPrefix(tokenize(markBoundaries(text)));
  // «гантели 10 кг, потом гречка»: слова про спорт закрываем, чтобы «10 кг» не ушли в гречку.
  for (const a of findActivities(tokens)) for (let i = a.start; i < a.end; i++) tokens[i] = '·';
  const matches = findFoods(tokens, catalog);

  // Фраза режется на части по «и», запятым и глаголам («выпил», «съел»): количество
  // берётся только из своей части, в каком бы порядке его ни сказали —
  // «макароны две тарелки и выпил 3 пива» → макароны ×2 тарелки, пиво ×3.
  const segmentOf = segmentIds(tokens);
  const out: ParsedEntity[] = [];
  let consumedUntil = 0;

  matches.forEach((match, i) => {
    const seg = segmentOf[match.start]!;
    const segStart = segmentOf.indexOf(seg);
    const segEnd = segmentOf.lastIndexOf(seg) + 1;
    const prev = matches[i - 1];
    const next = matches[i + 1];
    const prevEnd = Math.max(consumedUntil, segStart, prev && segmentOf[prev.start] === seg ? prev.end : segStart);
    const nextStart = next && segmentOf[next.start] === seg ? next.start : segEnd;
    const alone = !(prev && segmentOf[prev.start] === seg) && !(next && segmentOf[next.start] === seg);

    const before = readAmount(tokens.slice(prevEnd, match.start));
    const after = readAmount(tokens.slice(match.end, nextStart));
    let amount = before;
    consumedUntil = match.end;
    const beforeEmpty = before.quantity == null && before.unit == null && before.grams == null;
    if (beforeEmpty) {
      if (alone) {
        // Единственное блюдо в части — всё количество в ней его.
        amount = after;
        consumedUntil = segEnd;
      } else {
        // Несколько блюд в одной части («плов 300 грамм макароны»): после блюда берём
        // только явное «число + единица», голое «два» скорее про следующее блюдо.
        const first = tokens[match.end];
        const startsWithAmount = first != null && (wordToNumber(first) != null || readAmount([first]).unit != null);
        if (startsWithAmount && (after.grams != null || (after.quantity != null && after.unit != null))) {
          amount = after;
          consumedUntil = match.end + after.lastIndex + 1;
        }
      }
    }

    out.push({
      text: tokens.slice(match.start, match.end).join(' '),
      foodId: match.food.id,
      quantity: amount.quantity,
      unit: amount.unit,
      grams: amount.grams,
    });
  });
  return out;
}

const BOUNDARY = '|';
const CONJUNCTIONS = new Set(['и', 'а', 'потом', 'затем', 'еще', 'плюс', 'также', 'тоже', 'после', 'ну', 'короче', 'типа']);
/** Глаголы еды и питья начинают новую часть фразы. */
const VERB = /^(съел|съела|съели|выпил|выпила|выпили|поел|поела|попил|попила|скушал|скушала|перекусил|перекусила|закусил|закусила|запил|запила|навернул|сожрал|слопал|хлебнул|употребил|съем|выпью|пил|ел|ела|пила)$/;

function markBoundaries(text: string): string {
  return text
    .replace(/(\d)[,.](\d)/g, '$1d$2')
    .replace(/[,;!?]|\.(?!\d)/g, ` ${BOUNDARY} `)
    .replace(/(\d)d(\d)/g, '$1.$2');
}

function segmentIds(tokens: string[]): number[] {
  let seg = 0;
  return tokens.map((t) => {
    if (t === BOUNDARY || t === 'xx' || CONJUNCTIONS.has(t) || VERB.test(t)) {
      seg++;
      return -1;
    }
    return seg;
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
      if (quantity == null) quantity = n;
      else if (quantity >= 20 && n < quantity) quantity += n;
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
  // «тарелка борща» без числа — это одна тарелка.
  return { quantity: quantity ?? (unit != null ? 1 : null), unit, grams: null, lastIndex };
}


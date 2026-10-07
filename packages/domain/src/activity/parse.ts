import { stem, tokenize, wordToNumber, splitHalfPrefix } from '../food/text';
import { ACTIVITIES, ACTIVITY_BY_ID, ActivityDef } from './catalog';
import { ParsedActivity, ResolvedActivity } from './types';

interface Entry {
  def: ActivityDef;
  stems: string[];
}

const INDEX: Entry[] = ACTIVITIES.flatMap((def) => def.aliases.map((a) => ({ def, stems: tokenize(a).map(stem) }))).sort(
  (a, b) => b.stems.length - a.stems.length,
);

export interface ActivityMatch {
  def: ActivityDef;
  /** Токены, которые занимает активность вместе с длительностью/весом/повторами. */
  start: number;
  end: number;
  parsed: ParsedActivity;
}

/**
 * Находит активности во фразе и их параметры: «час», «полчаса», «40 минут», «20 раз», «10 кг».
 * Возвращает и занятые токены — чтобы «10 кг» гантели не стали «10 кг гречки».
 */
export function findActivities(rawTokens: string[]): ActivityMatch[] {
  const tokens = rawTokens;
  const stems = tokens.map(stem);
  const taken = new Array<boolean>(tokens.length).fill(false);
  const hits: Array<{ def: ActivityDef; start: number; end: number }> = [];

  for (const e of INDEX) {
    for (let i = 0; i + e.stems.length <= stems.length; i++) {
      if (e.stems.every((s, k) => !taken[i + k] && stems[i + k] === s)) {
        for (let k = 0; k < e.stems.length; k++) taken[i + k] = true;
        hits.push({ def: e.def, start: i, end: i + e.stems.length });
      }
    }
  }
  hits.sort((a, b) => a.start - b.start);

  // «занимался спортом с гантелями» — несколько слов одной сессии. Склеиваем близкие
  // упоминания; общее «спорт/занимался» уступает конкретному виду рядом.
  const merged: typeof hits = [];
  for (const h of hits) {
    const last = merged[merged.length - 1];
    if (last && h.start - last.end <= 3 && (last.def.id === h.def.id || last.def.id === 'strength' || h.def.id === 'strength')) {
      const specific = last.def.id === 'strength' ? h.def : last.def;
      merged[merged.length - 1] = { def: specific, start: last.start, end: h.end };
    } else merged.push(h);
  }

  return merged.map((m, i) => {
    const windowStart = i === 0 ? 0 : merged[i - 1]!.end;
    const windowEnd = i + 1 < merged.length ? merged[i + 1]!.start : tokens.length;
    const before = scanParams(tokens, Math.max(windowStart, m.start - 3), m.start);
    const after = scanParams(tokens, m.end, Math.min(windowEnd, m.end + 7));
    const p = { minutes: after.minutes ?? before.minutes, reps: after.reps ?? before.reps, weightKg: after.weightKg ?? before.weightKg };
    return {
      def: m.def,
      start: before.used ? before.from : m.start,
      end: after.used ? after.to : m.end,
      parsed: { text: tokens.slice(m.start, m.end).join(' '), activityId: m.def.id, ...p },
    };
  });
}

interface Params {
  minutes: number | null;
  reps: number | null;
  weightKg: number | null;
  used: boolean;
  from: number;
  to: number;
}

function scanParams(tokens: string[], from: number, to: number): Params {
  const out: Params = { minutes: null, reps: null, weightKg: null, used: false, from: to, to: from };
  let pending: number | null = null;
  const use = (i: number) => {
    out.used = true;
    out.from = Math.min(out.from, i);
    out.to = Math.max(out.to, i + 1);
  };
  for (let i = from; i < to; i++) {
    const t = tokens[i]!;
    const n = wordToNumber(t);
    if (n != null && t !== 'пол') {
      pending = pending != null && pending >= 20 && n < pending ? pending + n : n;
      use(i);
      continue;
    }
    const s = stem(t);
    if (t === 'полчаса') {
      out.minutes = 30;
      use(i);
    } else if (s === 'час' || t === 'ч') {
      out.minutes = (pending ?? 1) * 60;
      pending = null;
      use(i);
    } else if (s.startsWith('минут') || t === 'мин') {
      if (pending != null) out.minutes = pending;
      pending = null;
      use(i);
    } else if (t === 'кг' || s.startsWith('килограм') || s === 'кил') {
      if (pending != null) out.weightKg = pending;
      pending = null;
      use(i);
    } else if (t === 'раз' || s.startsWith('повтор') || s === 'подход') {
      if (pending != null) out.reps = (out.reps ?? 0) + pending;
      pending = null;
      use(i);
    } else if (t === 'пол' && tokens[i + 1] && stem(tokens[i + 1]!) === 'час') {
      pending = 0.5;
      use(i);
    }
  }
  // «20 отжиманий» — число перед словом без единицы считаем повторами.
  if (pending != null && out.reps == null && out.minutes == null) out.reps = pending;
  return out;
}

export function parseActivitiesHeuristic(text: string): ParsedActivity[] {
  return findActivities(splitHalfPrefix(tokenize(text))).map((m) => m.parsed);
}

export function activityKcal(def: ActivityDef, minutes: number, bodyWeightKg: number): number {
  return Math.round(def.met * bodyWeightKg * (minutes / 60));
}

export function resolveActivities(parsed: ParsedActivity[], bodyWeightKg: number): ResolvedActivity[] {
  const out: ResolvedActivity[] = [];
  for (const p of parsed) {
    const def = p.activityId ? ACTIVITY_BY_ID.get(p.activityId) : undefined;
    if (!def) continue;
    const reps = p.reps && p.reps > 0 ? Math.round(p.reps) : null;
    const fromReps = reps && def.repsPerMinute ? Math.max(1, Math.round(reps / def.repsPerMinute)) : null;
    const minutes = p.minutes && p.minutes > 0 ? Math.round(p.minutes) : fromReps ?? def.defaultMinutes;
    out.push({
      activityId: def.id,
      name: def.name,
      text: p.text,
      minutes,
      reps,
      weightKg: p.weightKg ?? null,
      assumed: !(p.minutes && p.minutes > 0) && !fromReps,
      kcal: activityKcal(def, minutes, bodyWeightKg),
    });
  }
  return out;
}

export function setActivityMinutes(a: ResolvedActivity, minutes: number, bodyWeightKg: number): ResolvedActivity {
  const def = ACTIVITY_BY_ID.get(a.activityId);
  const m = Math.max(1, Math.round(minutes));
  return { ...a, minutes: m, assumed: false, kcal: def ? activityKcal(def, m, bodyWeightKg) : a.kcal };
}

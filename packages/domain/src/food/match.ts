import { CATALOG } from './catalog';
import { stem, tokenize } from './text';
import { Food } from './types';

interface AliasEntry {
  food: Food;
  stems: string[];
}

export interface FoodMatch {
  food: Food;
  /** Индексы токенов [start, end) в исходной фразе. */
  start: number;
  end: number;
}

const indexCache = new WeakMap<readonly Food[], AliasEntry[]>();

function buildIndex(catalog: readonly Food[]): AliasEntry[] {
  const cached = indexCache.get(catalog);
  if (cached) return cached;
  const entries = catalog.flatMap((food) =>
    food.aliases.map((alias) => ({ food, stems: tokenize(alias).map(stem) })),
  );
  // Длинные алиасы первыми: «бутерброд с колбасой» важнее «бутерброда».
  entries.sort((a, b) => b.stems.length - a.stems.length);
  indexCache.set(catalog, entries);
  return entries;
}

/** Все блюда во фразе, без пересечений, в порядке упоминания. */
export function findFoods(tokens: string[], catalog: readonly Food[] = CATALOG): FoodMatch[] {
  const stems = tokens.map(stem);
  const taken = new Array<boolean>(tokens.length).fill(false);
  const matches: FoodMatch[] = [];

  for (const entry of buildIndex(catalog)) {
    const len = entry.stems.length;
    for (let start = 0; start + len <= stems.length; start++) {
      let ok = true;
      for (let k = 0; k < len; k++) {
        if (taken[start + k] || stems[start + k] !== entry.stems[k]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let k = 0; k < len; k++) taken[start + k] = true;
      matches.push({ food: entry.food, start, end: start + len });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

/** Лучшее блюдо для свободного названия («бутерброда с колбаской») или null. */
export function matchFood(text: string, catalog: readonly Food[] = CATALOG): Food | null {
  const tokens = tokenize(text);
  const matches = findFoods(tokens, catalog);
  if (matches.length === 0) return null;
  return matches.reduce((best, m) => (m.end - m.start > best.end - best.start ? m : best)).food;
}

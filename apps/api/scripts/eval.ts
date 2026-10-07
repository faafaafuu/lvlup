/**
 * Эталонный прогон разбора фраз: `npm run eval -- anthropic` (или openai | ollama | heuristic).
 * Считает полноту и точность по блюдам, точность количества и задержку.
 * Критерий ТЗ «90% популярных блюд» = recall по foodId на этом наборе.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ParsedEntity, resolveMeal } from '@levelup/domain';
import { ExtractorName, loadConfig } from '../src/config';
import { createExtractor } from '../src/parsing/extractors';

interface Case {
  text: string;
  expect: Array<{ foodId: string; quantity?: number; unit?: string; grams?: number }>;
}

async function main() {
  const name = (process.argv[2] ?? 'heuristic') as ExtractorName;
  const config = loadConfig();
  const extractor = createExtractor(name, config);
  const cases: Case[] = JSON.parse(readFileSync(join(__dirname, '../../../eval/phrases.json'), 'utf8'));

  let expected = 0, found = 0, predicted = 0, correctPredicted = 0, qtyChecks = 0, qtyOk = 0;
  const latencies: number[] = [];
  const failures: string[] = [];

  for (const c of cases) {
    const started = Date.now();
    let got: ParsedEntity[] = [];
    try {
      got = (await extractor.extract(c.text, AbortSignal.timeout(20000))).items;
    } catch (err) {
      failures.push(`ОШИБКА «${c.text}»: ${err instanceof Error ? err.message : err}`);
    }
    latencies.push(Date.now() - started);

    // Сравниваем итог, который увидит пользователь: после резолвера с порциями по умолчанию.
    const items = resolveMeal(c.text, got).items;
    const gotIds = items.map((g) => g.foodId);
    predicted += items.length;
    correctPredicted += items.filter((g) => c.expect.some((e) => e.foodId === g.foodId)).length;
    for (const e of c.expect) {
      expected++;
      const hit = items.find((g) => g.foodId === e.foodId);
      if (!hit) {
        failures.push(`нет ${e.foodId} в «${c.text}» → [${gotIds.join(', ')}]`);
        continue;
      }
      found++;
      for (const key of ['quantity', 'unit', 'grams'] as const) {
        if (e[key] === undefined) continue;
        qtyChecks++;
        if (hit[key] === e[key]) qtyOk++;
        else failures.push(`${e.foodId}.${key}: ждали ${e[key]}, получили ${hit[key]} в «${c.text}»`);
      }
    }
  }

  latencies.sort((a, b) => a - b);
  const pct = (a: number, b: number) => `${((a / Math.max(1, b)) * 100).toFixed(1)}%`;
  const p = (q: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * q))];
  console.log(`\nИзвлекатель: ${name}, фраз: ${cases.length}`);
  console.log(`Полнота (блюда найдены):  ${pct(found, expected)}  (${found}/${expected})`);
  console.log(`Точность (без лишних):    ${pct(correctPredicted, predicted)}  (${correctPredicted}/${predicted})`);
  console.log(`Количество/единицы/вес:   ${pct(qtyOk, qtyChecks)}  (${qtyOk}/${qtyChecks})`);
  console.log(`Задержка p50/p80/max:     ${p(0.5)} / ${p(0.8)} / ${latencies.at(-1)} мс`);
  if (failures.length) console.log(`\nПромахи:\n  ${failures.join('\n  ')}`);
}

void main();

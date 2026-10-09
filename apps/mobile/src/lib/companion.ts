import { BankSummary } from '@levelup/domain';
import { Accessory, Mood, Stage } from '@/design/companion/companionGeometry';

export interface CompanionState {
  stage: Stage;
  stageName: string;
  mood: Mood;
  accessory: Accessory;
  /** Что Лайм говорит прямо сейчас — одна короткая подсказка по делу. */
  line: string;
  /** Сколько хороших дней до следующей стадии (null — уже Древо). */
  toNext: number | null;
}

const STAGES: Array<[min: number, stage: Stage, name: string]> = [
  [0, 1, 'Росток'],
  [10, 2, 'Побег'],
  [30, 3, 'Древо'],
];

/**
 * Лайм — не «игровой» персонаж с опытом: он растёт только от хороших дней
 * (10 — Побег, 30 — Древо), а аксессуары даёт серия подряд (7, 14, 30 дней).
 */
export function companionState(bank: BankSummary, hour: number): CompanionState {
  const goodTotal = bank.days.filter((d) => d.good).length + (bank.today.good ? 1 : 0);
  let current = STAGES[0]!;
  for (const s of STAGES) if (goodTotal >= s[0]) current = s;
  const nextStage = STAGES.find((s) => s[0] > goodTotal);
  const accessory: Accessory = bank.streak >= 30 ? 'crown' : bank.streak >= 14 ? 'cape' : bank.streak >= 7 ? 'band' : 'none';

  const t = bank.today;
  const left = t.checks.filter((c) => !c.done);
  let mood: Mood = 'idle';
  let line: string;
  if (t.score === 3) {
    mood = 'happy';
    line = 'Идеальный день! В полночь копилка пополнится.';
  } else if (t.good) {
    mood = 'happy';
    line = `Хороший день. Ещё «${left[0]?.title.toLowerCase()}» — и будет идеальный.`;
  } else if (t.checks[0]!.done === false && hour >= 11) {
    mood = hour >= 20 ? 'sleepy' : 'idle';
    line = 'Я голоден до записей 🙂 Нажми на микрофон и скажи, что ел.';
  } else if (hour < 11 && !t.checks[0]!.done) {
    mood = 'wave';
    line = 'Доброе утро! Что на завтрак?';
  } else {
    line = left.length ? `Осталось: ${left.map((c) => c.title.toLowerCase()).join(', ')}.` : 'Так держать!';
  }
  return { stage: current[1], stageName: current[2], mood, accessory, line, toNext: nextStage ? nextStage[0] - goodTotal : null };
}

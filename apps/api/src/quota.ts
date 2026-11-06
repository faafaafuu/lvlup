import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Бесплатные разборы с ИИ на установку приложения (x-device) за календарный месяц.
 * Что сверх — приложение разбирает фразу на телефоне (бесплатно и без сервера), а позже
 * это место займёт подписка «Хрум Плюс».
 *
 * Счётчики переживают перезапуск сервиса: лежат в JOURNAL_DIR/quota-YYYY-MM.json
 * (только случайный id установки и число, без текста и адресов), пишутся не чаще раза в 10 с.
 */
export interface DeviceUsage {
  /** Сколько разборов с ИИ в этом месяце. */
  used: number;
  /** Месяц первого появления установки, YYYY-MM — для щедрого первого месяца. */
  firstMonth: string;
}

/**
 * Сколько бесплатных разборов с ИИ даём установке в этом месяце.
 * month и usage.firstMonth — строки 'YYYY-MM', их можно сравнивать как строки.
 */
export function freeAllowance(month: string, usage: DeviceUsage, base: number): number {
  // TODO(human): правило бесплатного лимита.
  return base;
}

export class Quota {
  private month = '';
  private data: Record<string, DeviceUsage> = {};
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly dir: string,
    private readonly base: number,
  ) {}

  /** Списать один разбор. Возвращает, сколько осталось после него; -1 — лимит уже был исчерпан. */
  take(device: string, now = new Date()): number {
    this.load(now);
    const u = (this.data[device] ??= { used: 0, firstMonth: this.month });
    const allowed = freeAllowance(this.month, u, this.base);
    if (u.used >= allowed) return -1;
    u.used++;
    this.save();
    return allowed - u.used;
  }

  private file() {
    return join(this.dir, `quota-${this.month}.json`);
  }

  private load(now: Date) {
    const month = now.toISOString().slice(0, 7);
    if (month === this.month) return;
    this.flush();
    const prev = this.data;
    this.month = month;
    try {
      this.data = existsSync(this.file()) ? JSON.parse(readFileSync(this.file(), 'utf8')) : {};
    } catch {
      this.data = {};
    }
    // Новый месяц: счёт с нуля, но месяц первого появления помним.
    for (const [id, u] of Object.entries(prev)) this.data[id] ??= { used: 0, firstMonth: u.firstMonth };
  }

  private save() {
    this.dirty = true;
    this.timer ??= setTimeout(() => {
      this.timer = null;
      this.flush();
    }, 10_000);
  }

  flush() {
    if (!this.dirty || !this.month) return;
    try {
      mkdirSync(this.dir, { recursive: true });
      writeFileSync(this.file(), JSON.stringify(this.data));
      this.dirty = false;
    } catch {
      // Нет диска — считаем в памяти, это не повод ронять разбор.
    }
  }
}

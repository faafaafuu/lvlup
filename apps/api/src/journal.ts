import { appendFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Журнал разборов для исправления ошибок: файл на день, старше KEEP_DAYS — удаляется.
 * Так он хранится ровно столько, сколько обещает политика конфиденциальности (/privacy);
 * в системный журнал фразы не пишем — там срок хранения не управляется.
 */
const KEEP_DAYS = 14;
const DIR = process.env.JOURNAL_DIR || join(process.cwd(), 'journal');
let lastCleanup = '';

export function journal(line: string): void {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  void (async () => {
    await mkdir(DIR, { recursive: true });
    await appendFile(join(DIR, `${day}.log`), `${now.toISOString().slice(11, 19)} ${line}\n`);
    if (lastCleanup === day) return;
    lastCleanup = day;
    const edge = new Date(now.getTime() - KEEP_DAYS * 86400_000).toISOString().slice(0, 10);
    for (const name of await readdir(DIR)) if (name.endsWith('.log') && name.slice(0, 10) < edge) await unlink(join(DIR, name));
  })().catch(() => {});
}

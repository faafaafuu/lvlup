import { DateKey } from './types';

export function dateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return dateKey(new Date(y, m - 1, d + days));
}

export function mealDateKey(iso: string): DateKey {
  return dateKey(new Date(iso));
}

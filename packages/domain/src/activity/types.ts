/** Что извлёк разбор из фразы про активность — без калорий. */
export interface ParsedActivity {
  text: string;
  activityId?: string | null;
  minutes?: number | null;
  reps?: number | null;
  /** Вес снаряда, если назван («гантели 10 кг») — для истории, на калории не влияет. */
  weightKg?: number | null;
}

export interface ResolvedActivity {
  activityId: string;
  name: string;
  text: string;
  minutes: number;
  reps: number | null;
  weightKg: number | null;
  /** true, если длительность угадана. */
  assumed: boolean;
  kcal: number;
}

/** Сохранённая тренировка. */
export interface ActivitySession extends ResolvedActivity {
  id: string;
  at: string;
}

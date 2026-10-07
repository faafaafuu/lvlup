/**
 * Виды активности и их MET (метаболический эквивалент): ккал = MET × вес(кг) × часы.
 * Значения — из Compendium of Physical Activities, округлены.
 */
export interface ActivityDef {
  id: string;
  name: string;
  aliases: string[];
  met: number;
  /** Длительность по умолчанию, если не названа. */
  defaultMinutes: number;
  /** Повторений в минуту — для «20 отжиманий» без времени. */
  repsPerMinute?: number;
}

export const ACTIVITIES: ActivityDef[] = [
  { id: 'strength', name: 'Силовая тренировка', aliases: ['силовая', 'тренировка', 'тренировался', 'зал', 'тренажерный зал', 'тренажерка', 'качалка', 'гантели', 'гантелями', 'штанга', 'жим', 'спорт', 'занимался спортом', 'позанимался', 'занимался'], met: 5, defaultMinutes: 45 },
  { id: 'running', name: 'Бег', aliases: ['бег', 'бегал', 'побегал', 'пробежка', 'пробежал', 'бегом'], met: 9, defaultMinutes: 30 },
  { id: 'walking', name: 'Прогулка', aliases: ['прогулка', 'гулял', 'погулял', 'ходьба', 'прошелся', 'пешком', 'гуляли'], met: 3.5, defaultMinutes: 30 },
  { id: 'cycling', name: 'Велосипед', aliases: ['велосипед', 'велик', 'велотренажер', 'катался на велосипеде'], met: 7, defaultMinutes: 45 },
  { id: 'swimming', name: 'Плавание', aliases: ['плавание', 'плавал', 'поплавал', 'бассейн'], met: 7, defaultMinutes: 45 },
  { id: 'yoga', name: 'Йога и растяжка', aliases: ['йога', 'растяжка', 'стретчинг', 'пилатес', 'тянулся'], met: 2.8, defaultMinutes: 30 },
  { id: 'hiit', name: 'Интервальная тренировка', aliases: ['кроссфит', 'интервальная', 'табата', 'функциональная'], met: 8, defaultMinutes: 30 },
  { id: 'cardio', name: 'Кардио', aliases: ['кардио', 'эллипс', 'беговая дорожка', 'дорожка', 'степпер'], met: 7, defaultMinutes: 30 },
  { id: 'team_sport', name: 'Игровой спорт', aliases: ['футбол', 'баскетбол', 'волейбол', 'теннис', 'хоккей', 'падел'], met: 7, defaultMinutes: 60 },
  { id: 'boxing', name: 'Единоборства', aliases: ['бокс', 'кикбоксинг', 'борьба', 'единоборства', 'груша'], met: 9, defaultMinutes: 45 },
  { id: 'dancing', name: 'Танцы', aliases: ['танцы', 'танцевал', 'зумба'], met: 5, defaultMinutes: 45 },
  { id: 'skiing', name: 'Лыжи и коньки', aliases: ['лыжи', 'коньки', 'сноуборд', 'катался на лыжах'], met: 7, defaultMinutes: 60 },
  { id: 'pushups', name: 'Отжимания', aliases: ['отжимания', 'отжался', 'отжимался', 'отжиманий'], met: 4, defaultMinutes: 5, repsPerMinute: 20 },
  { id: 'squats', name: 'Приседания', aliases: ['приседания', 'приседал', 'присел', 'приседаний'], met: 5, defaultMinutes: 5, repsPerMinute: 20 },
  { id: 'pullups', name: 'Подтягивания', aliases: ['подтягивания', 'подтянулся', 'подтягивался', 'подтягиваний'], met: 8, defaultMinutes: 5, repsPerMinute: 10 },
  { id: 'plank', name: 'Планка', aliases: ['планка', 'планку', 'стоял в планке'], met: 4, defaultMinutes: 3 },
];

export const ACTIVITY_BY_ID: ReadonlyMap<string, ActivityDef> = new Map(ACTIVITIES.map((a) => [a.id, a]));

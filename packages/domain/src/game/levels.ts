export const XP_PER_LEVEL = 1000;

export interface LevelInfo {
  level: number;
  /** XP внутри текущего уровня. */
  current: number;
  needed: number;
  title: string;
}

const TITLES: Array<[minLevel: number, title: string]> = [
  [1, 'Новичок'],
  [3, 'Странник'],
  [5, 'Искатель'],
  [8, 'Воин'],
  [12, 'Ветеран'],
  [16, 'Чемпион'],
  [20, 'Легенда'],
];

export function levelInfo(xp: number): LevelInfo {
  const level = Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
  return { level, current: Math.max(0, xp) % XP_PER_LEVEL, needed: XP_PER_LEVEL, title: titleFor(level) };
}

export function titleFor(level: number): string {
  let title = TITLES[0]![1];
  for (const [min, t] of TITLES) if (level >= min) title = t;
  return title;
}

export interface ShopItem {
  id: string;
  name: string;
  slot: 'outfit' | 'accessory' | 'booster';
  /** Цвет одежды или вариант аксессуара — для отрисовки героя. */
  value: string;
  unlockLevel?: number;
  price?: number;
}

/** Предметы: часть открывается уровнем, часть покупается за монеты. */
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'outfit_gray', name: 'Серая футболка', slot: 'outfit', value: '#8A94A6', unlockLevel: 1 },
  { id: 'outfit_blue', name: 'Синяя форма', slot: 'outfit', value: '#3B82F6', unlockLevel: 2 },
  { id: 'outfit_green', name: 'Лесной костюм', slot: 'outfit', value: '#22C55E', unlockLevel: 4 },
  { id: 'outfit_red', name: 'Алый доспех', slot: 'outfit', value: '#EF4444', price: 150 },
  { id: 'outfit_purple', name: 'Мантия мага', slot: 'outfit', value: '#A855F7', price: 250 },
  { id: 'outfit_gold', name: 'Золотые латы', slot: 'outfit', value: '#EAB308', unlockLevel: 10 },
  { id: 'acc_headband', name: 'Повязка', slot: 'accessory', value: 'headband', unlockLevel: 3 },
  { id: 'acc_cape', name: 'Плащ', slot: 'accessory', value: 'cape', unlockLevel: 5 },
  { id: 'acc_crown', name: 'Корона', slot: 'accessory', value: 'crown', unlockLevel: 10 },
  { id: 'acc_glasses', name: 'Очки', slot: 'accessory', value: 'glasses', price: 80 },
  { id: 'boost_double_xp', name: 'Двойной XP на день', slot: 'booster', value: 'double_xp', price: 100 },
  { id: 'boost_freeze', name: 'Заморозка серии', slot: 'booster', value: 'freeze', price: 50 },
];

export function isUnlocked(item: ShopItem, level: number, inventory: string[]): boolean {
  if (inventory.includes(item.id)) return true;
  return item.unlockLevel != null && level >= item.unlockLevel;
}

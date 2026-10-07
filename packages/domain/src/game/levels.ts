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
  [3, 'Путник'],
  [4, 'Странник'],
  [5, 'Искатель'],
  [7, 'Следопыт'],
  [10, 'Герой'],
  [15, 'Чемпион'],
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
  { id: 'outfit_gray', name: 'Графитовая форма', slot: 'outfit', value: '#3A3F4B', unlockLevel: 1 },
  { id: 'outfit_violet', name: 'Фиолетовая куртка', slot: 'outfit', value: '#7B5CFF', unlockLevel: 2 },
  { id: 'outfit_teal', name: 'Лесной костюм', slot: 'outfit', value: '#16A394', unlockLevel: 4 },
  { id: 'outfit_coral', name: 'Коралловый доспех', slot: 'outfit', value: '#FF7A59', price: 150 },
  { id: 'outfit_blue', name: 'Синяя мантия', slot: 'outfit', value: '#3D8BFF', price: 250 },
  { id: 'outfit_gold', name: 'Золотые латы', slot: 'outfit', value: '#E8A93A', unlockLevel: 10 },
  { id: 'acc_headband', name: 'Повязка', slot: 'accessory', value: 'headband', unlockLevel: 3 },
  { id: 'acc_cloak', name: 'Плащ', slot: 'accessory', value: 'cloak', unlockLevel: 5, price: 300 },
  { id: 'acc_crown', name: 'Корона', slot: 'accessory', value: 'crown', unlockLevel: 10 },
  { id: 'boost_double_xp', name: 'Двойной XP на день', slot: 'booster', value: 'double_xp', price: 100 },
  { id: 'boost_freeze', name: 'Заморозка серии', slot: 'booster', value: 'freeze', price: 50 },
];

export function isUnlocked(item: ShopItem, level: number, inventory: string[]): boolean {
  if (inventory.includes(item.id)) return true;
  return item.unlockLevel != null && level >= item.unlockLevel;
}

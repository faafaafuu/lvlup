export type UnitId =
  | 'g' | 'ml' | 'piece' | 'plate' | 'bowl' | 'serving' | 'slice' | 'glass' | 'cup'
  | 'tbsp' | 'tsp' | 'handful' | 'pack' | 'bottle' | 'can' | 'bar' | 'square';

export interface Nutrients {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type FoodTag = 'sweet' | 'alcohol' | 'drink' | 'water' | 'fastfood' | 'vegetable' | 'fruit';

/** Вариант порции для уточняющего вопроса: «Шоколадка — квадратик или вся плитка?» */
export interface PortionOption {
  label: string;
  grams: number;
}

export interface Food {
  id: string;
  name: string;
  /** Формы в именительном падеже; косвенные падежи ловит стеммер. */
  aliases: string[];
  per100g: Nutrients;
  defaultUnit: UnitId;
  /** Граммы на единицу именно для этого блюда (перекрывают общие UNIT_GRAMS). */
  units?: Partial<Record<UnitId, number>>;
  /** Если количество не названо и разброс большой — спросим, выбрав из этих вариантов. */
  portionOptions?: PortionOption[];
  tags?: FoodTag[];
}

/** То, что извлекает LLM или офлайн-разбор: ни одной калории, только смысл фразы. */
export interface ParsedEntity {
  /** Как прозвучало: «плова», «бутерброда с колбасой». */
  text: string;
  /** id из каталога, если извлекатель уверен. */
  foodId?: string | null;
  quantity?: number | null;
  unit?: UnitId | null;
  /** Явно названный вес/объём («200 грамм»). */
  grams?: number | null;
}

/** Личные порции «ленивого режима»: «моя тарелка = 300 г», «мой бутерброд = 80 г». */
export interface UserPortions {
  /** Посуда пользователя: plate, bowl, cup, glass, tbsp, tsp. */
  units?: Partial<Record<UnitId, number>>;
  /** Граммы на одну «свою» единицу конкретного блюда: { sandwich_sausage: 80 }. */
  foods?: Record<string, number>;
}

export interface ResolvedItem {
  foodId: string;
  name: string;
  text: string;
  quantity: number;
  unit: UnitId;
  grams: number;
  /** true, если количество/порцию мы угадали, а не услышали. */
  assumed: boolean;
  nutrients: Nutrients;
}

export interface ClarifyQuestion {
  id: string;
  itemIndex: number;
  text: string;
  options: Array<PortionOption & { kcal: number }>;
  defaultIndex: number;
}

export interface MealDraft {
  sourceText: string;
  items: ResolvedItem[];
  /** Фразы, которые не нашлись в каталоге. */
  unknown: string[];
  questions: ClarifyQuestion[];
  totals: Nutrients;
}

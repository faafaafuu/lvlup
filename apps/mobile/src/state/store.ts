import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DateKey, DayActivity, GameState, MealDraft, MealLog, Profile, UserPortions, WeightEntry, dateKey, gameSummary, mealSlot, normOn, dayStats, sumNutrients } from '@levelup/domain';
import { newId } from '@/lib/id';
import type { ThemePref } from '@/ui/theme';

export interface Settings {
  /** Адрес сервера разбора; пусто — только офлайн-разбор на телефоне. */
  apiUrl: string;
  apiToken: string;
  theme: ThemePref;
  reminders: boolean;
  health: boolean;
  /** Вибрация при награде. */
  rewardHaptics: boolean;
  /** Остаток калорий в Dynamic Island; undefined у старых установок = включено. */
  island?: boolean;
  /** Когда последний раз синхронизировались со Здоровьем. */
  healthSyncedAt?: string | null;
}

export interface PendingPhrase {
  id: string;
  text: string;
  at: string;
}

/** Что показать на экране награды после записи. */
export interface RewardInfo {
  xp: number;
  coins: number;
  totalCoins: number;
  streak: number;
  level: number;
  levelXp: number;
  levelUp: boolean;
  kcalLeft: number;
  slot: string;
  day: DateKey;
}

/** Раздел главного экрана: дневник · сегодня · прогресс. */
export type Page = 0 | 1 | 2;

/** Только что удалённое — плашка «Вернуть» на несколько секунд. */
export interface UndoInfo {
  label: string;
  restore(): void;
}

interface Data {
  onboarded: boolean;
  profile: Profile | null;
  portions: UserPortions;
  meals: MealLog[];
  activity: Record<DateKey, DayActivity>;
  weights: WeightEntry[];
  settings: Settings;
  pending: PendingPhrase[];
}

interface Actions {
  completeOnboarding(profile: Profile, portions: UserPortions): void;
  /** Записывает еду и активность из одной фразы и готовит экран награды. */
  addEntry(draft: MealDraft, at?: string): boolean;
  /** Заменить продукты записи (порция поправлена, продукт убран); пусто — запись удаляется. */
  updateMeal(id: string, items: MealLog['items']): void;
  /** Удаляют с плашкой «Вернуть». */
  deleteMeal(id: string): void;
  /** Убрать один продукт из записи (последний — вся запись). */
  deleteItem(mealId: string, index: number): void;
  deleteSession(date: DateKey, id: string): void;
  setPage(page: Page): void;
  clearUndo(): void;
  addWeight(kg: number, date?: DateKey): void;
  patchActivity(date: DateKey, patch: Partial<DayActivity>): void;
  addPending(text: string): void;
  removePending(id: string): void;
  updateSettings(patch: Partial<Settings>): void;
  updatePortions(portions: UserPortions): void;
  updateProfile(patch: Partial<Profile>): void;
  setViewDate(d: DateKey): void;
  clearReward(): void;
  resetAll(): void;
}

export type AppState = Data &
  Actions & {
    /** День, открытый в дневнике; запись голосом идёт в него. Не сохраняется. */
    viewDate: DateKey;
    reward: RewardInfo | null;
    page: Page;
    undo: UndoInfo | null;
  };

const today = () => dateKey(new Date());

const INITIAL: Data = {
  onboarded: false,
  profile: null,
  portions: { units: { plate: 300, cup: 250, glass: 250, tbsp: 15 }, foods: {} },
  meals: [],
  activity: {},
  weights: [],
  settings: { apiUrl: '', apiToken: '', theme: 'dark', reminders: true, health: false, rewardHaptics: true },
  pending: [],
};

const gameOf = (s: Data): GameState | null => (s.profile ? { profile: s.profile, meals: s.meals, activity: s.activity, weights: s.weights } : null);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      viewDate: today(),
      reward: null,
      page: 1,
      undo: null,

      completeOnboarding(profile, portions) {
        set({ onboarded: true, profile, portions, weights: [{ date: today(), kg: profile.startWeightKg }] });
      },

      addEntry(draft, at = new Date().toISOString()) {
        const activities = draft.activities ?? [];
        if (!draft.items.length && !activities.length) return false;
        const before = gameOf(get());
        const prev = before ? gameSummary(before) : null;
        const day = dateKey(new Date(at));
        set((s) => {
          const patch: Partial<Data> = {};
          if (draft.items.length) {
            patch.meals = [...s.meals, { id: newId(), at, text: draft.sourceText, items: draft.items, totals: draft.totals }];
          }
          if (activities.length) {
            const p = s.activity[day];
            const sessions = [...(p?.sessions ?? []), ...activities.map((a) => ({ ...a, id: newId(), at }))];
            patch.activity = { ...s.activity, [day]: { ...p, date: day, sessions } };
          }
          return patch;
        });
        const after = gameOf(get());
        if (after && prev) {
          const next = gameSummary(after);
          const stats = dayStats(day, after.meals, after.activity[day]);
          set({
            reward: {
              xp: next.xp - prev.xp,
              coins: next.coins - prev.coins,
              totalCoins: next.coins,
              streak: next.streak,
              level: next.level,
              levelXp: next.levelXp,
              levelUp: next.level > prev.level,
              kcalLeft: normOn(after, day) - stats.kcal,
              slot: draft.items.length ? mealSlot(at) : 'Тренировка',
              day,
            },
          });
        }
        return true;
      },

      updateMeal(id, items) {
        if (!items.length) return get().deleteMeal(id);
        set((s) => ({ meals: s.meals.map((m) => (m.id === id ? { ...m, items, totals: sumNutrients(items) } : m)) }));
      },

      deleteMeal(id) {
        const meal = get().meals.find((m) => m.id === id);
        if (!meal) return;
        set((s) => ({
          meals: s.meals.filter((m) => m.id !== id),
          undo: {
            label: meal.items.map((i) => i.name).join(', ') || 'Запись',
            restore: () => set((x) => ({ meals: [...x.meals, meal], undo: null })),
          },
        }));
      },

      deleteItem(mealId, index) {
        const meal = get().meals.find((m) => m.id === mealId);
        const item = meal?.items[index];
        if (!meal || !item) return;
        if (meal.items.length === 1) return get().deleteMeal(mealId);
        const items = meal.items.filter((_, i) => i !== index);
        set((s) => ({
          meals: s.meals.map((m) => (m.id === mealId ? { ...m, items, totals: sumNutrients(items) } : m)),
          undo: {
            label: item.name,
            restore: () => set((x) => ({ meals: x.meals.map((m) => (m.id === mealId ? meal : m)), undo: null })),
          },
        }));
      },

      deleteSession(date, id) {
        const session = get().activity[date]?.sessions?.find((x) => x.id === id);
        if (!session) return;
        const without = (s: AppState) => {
          const p = s.activity[date];
          return { ...s.activity, [date]: { ...p, date, sessions: (p?.sessions ?? []).filter((x) => x.id !== id) } };
        };
        set((s) => ({
          activity: without(s),
          undo: {
            label: session.name,
            restore: () =>
              set((x) => {
                const p = x.activity[date];
                return { activity: { ...x.activity, [date]: { ...p, date, sessions: [...(p?.sessions ?? []), session] } }, undo: null };
              }),
          },
        }));
      },

      setPage(page) {
        set({ page });
      },

      clearUndo() {
        set({ undo: null });
      },

      addWeight(kg, date = today()) {
        set((s) => ({ weights: [...s.weights.filter((w) => w.date !== date), { date, kg }] }));
      },

      patchActivity(date, patch) {
        set((s) => ({ activity: { ...s.activity, [date]: { ...s.activity[date], ...patch, date } } }));
      },

      addPending(text) {
        set((s) => ({ pending: [...s.pending, { id: newId(), text, at: new Date().toISOString() }] }));
      },

      removePending(id) {
        set((s) => ({ pending: s.pending.filter((p) => p.id !== id) }));
      },

      updateSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      updatePortions(portions) {
        set({ portions });
      },

      updateProfile(patch) {
        set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : {}));
      },

      setViewDate(d) {
        set({ viewDate: d > today() ? today() : d });
      },

      clearReward() {
        set({ reward: null });
      },

      resetAll() {
        set({ ...INITIAL, viewDate: today(), reward: null, page: 1, undo: null });
      },
    }),
    {
      name: 'levelup-state',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      // v1/v2 → v3: уровни/копилка/фото прежних версий убраны; записи, вес и настройки сохраняются.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Record<string, unknown> & Partial<Data>;
        const settings = { ...INITIAL.settings, ...(old.settings ?? {}) } as Settings;
        if ((settings.theme as string) === 'light') settings.theme = 'cobalt';
        return {
          ...INITIAL,
          onboarded: old.onboarded ?? false,
          profile: old.profile ?? null,
          portions: old.portions ?? INITIAL.portions,
          meals: old.meals ?? [],
          activity: old.activity ?? {},
          weights: old.weights ?? [],
          pending: old.pending ?? [],
          settings,
        } satisfies Data;
      },
      partialize: (s): Data => ({
        onboarded: s.onboarded,
        profile: s.profile,
        portions: s.portions,
        meals: s.meals,
        activity: s.activity,
        weights: s.weights,
        settings: s.settings,
        pending: s.pending,
      }),
    },
  ),
);

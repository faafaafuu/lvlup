import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DateKey, DayActivity, EMPTY_PROGRESS, MealDraft, MealLog, Profile, Progress, Reward, SHOP_ITEMS, UserPortions,
  WeightEntry, activeDays, collectRewards, dateKey, isUnlocked, levelInfo, rescuableDay,
} from '@levelup/domain';
import { newId } from '@/lib/id';

export interface AvatarLook {
  skin: string;
  hair: 0 | 1 | 2;
  hairColor: string;
}

export interface Settings {
  /** Адрес сервера разбора; пусто — только офлайн-разбор на телефоне. */
  apiUrl: string;
  apiToken: string;
  theme: 'system' | 'dark' | 'light';
  reminders: boolean;
  health: boolean;
}

export interface PendingPhrase {
  id: string;
  text: string;
  at: string;
}

interface Data {
  onboarded: boolean;
  profile: Profile | null;
  look: AvatarLook;
  portions: UserPortions;
  meals: MealLog[];
  activity: Record<DateKey, DayActivity>;
  weights: WeightEntry[];
  progress: Progress;
  settings: Settings;
  pending: PendingPhrase[];
}

interface Ephemeral {
  /** Награды, ещё не показанные тостом. */
  rewardQueue: Reward[];
  levelUp: number | null;
}

interface Actions {
  completeOnboarding(profile: Profile, look: AvatarLook, portions: UserPortions): void;
  /** Записывает и еду, и активность из одной фразы. Возвращает true, если что-то записано. */
  addEntry(draft: MealDraft, at?: string): boolean;
  deleteSession(date: DateKey, id: string): void;
  deleteMeal(id: string): void;
  addWeight(kg: number, date?: DateKey): void;
  patchActivity(date: DateKey, patch: Partial<DayActivity>): void;
  toggleManualQuest(questId: string): void;
  addPending(text: string): void;
  removePending(id: string): void;
  buy(itemId: string): string | null;
  equip(itemId: string): void;
  updateSettings(patch: Partial<Settings>): void;
  updatePortions(portions: UserPortions): void;
  updateProfile(patch: Partial<Profile>): void;
  updateLook(patch: Partial<AvatarLook>): void;
  /** Начислить всё положенное — звать после любого изменения данных. */
  settle(now?: Date): void;
  shiftReward(): void;
  dismissLevelUp(): void;
  resetAll(): void;
}

export type AppState = Data & Ephemeral & Actions;

const INITIAL: Data = {
  onboarded: false,
  profile: null,
  look: { skin: '#EDBB97', hair: 0, hairColor: '#6B3E26' },
  portions: { units: { plate: 300, cup: 250, glass: 250, tbsp: 15 }, foods: {} },
  meals: [],
  activity: {},
  weights: [],
  progress: { ...EMPTY_PROGRESS, equipped: { outfit: 'outfit_gray' } },
  settings: { apiUrl: '', apiToken: '', theme: 'system', reminders: true, health: false },
  pending: [],
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      rewardQueue: [],
      levelUp: null,

      completeOnboarding(profile, look, portions) {
        const today = dateKey(new Date());
        set({ onboarded: true, profile, look, portions, weights: [{ date: today, kg: profile.startWeightKg }] });
      },

      addEntry(draft, at = new Date().toISOString()) {
        const activities = draft.activities ?? [];
        if (!draft.items.length && !activities.length) return false;
        const day = dateKey(new Date(at));
        set((s) => {
          const patch: Partial<Data> = {};
          if (draft.items.length) {
            const meal: MealLog = { id: newId(), at, text: draft.sourceText, items: draft.items, totals: draft.totals };
            patch.meals = [...s.meals, meal];
          }
          if (activities.length) {
            const prev = s.activity[day];
            const sessions = [...(prev?.sessions ?? []), ...activities.map((a) => ({ ...a, id: newId(), at }))];
            patch.activity = { ...s.activity, [day]: { ...prev, date: day, sessions } };
          }
          return patch;
        });
        get().settle();
        return true;
      },

      deleteSession(date, id) {
        set((s) => {
          const prev = s.activity[date];
          if (!prev) return {};
          return { activity: { ...s.activity, [date]: { ...prev, sessions: (prev.sessions ?? []).filter((x) => x.id !== id) } } };
        });
      },

      deleteMeal(id) {
        // Опыт за удалённую запись не отбираем: ключ награды уже выдан, повторно не начислится.
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
      },

      addWeight(kg, date = dateKey(new Date())) {
        set((s) => ({ weights: [...s.weights.filter((w) => w.date !== date), { date, kg }] }));
        get().settle();
      },

      patchActivity(date, patch) {
        set((s) => ({ activity: { ...s.activity, [date]: { ...s.activity[date], ...patch, date } } }));
        get().settle();
      },

      toggleManualQuest(questId) {
        const date = dateKey(new Date());
        const done = get().activity[date]?.manualDone ?? [];
        const next = done.includes(questId) ? done.filter((q) => q !== questId) : [...done, questId];
        get().patchActivity(date, { manualDone: next });
      },

      addPending(text) {
        set((s) => ({ pending: [...s.pending, { id: newId(), text, at: new Date().toISOString() }] }));
      },

      removePending(id) {
        set((s) => ({ pending: s.pending.filter((p) => p.id !== id) }));
      },

      buy(itemId) {
        const s = get();
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item?.price) return 'Этот предмет не продаётся';
        if (s.progress.coins < item.price) return 'Не хватает монет';
        const today = dateKey(new Date());
        const progress = { ...s.progress, coins: s.progress.coins - item.price };
        if (item.value === 'double_xp') {
          if (progress.doubleXpDays.includes(today)) return 'Двойной XP уже активен сегодня';
          progress.doubleXpDays = [...progress.doubleXpDays, today];
        } else if (item.value === 'freeze') {
          const day = rescuableDay(activeDays({ ...s, profile: s.profile! }), today, progress.frozenDays);
          if (!day) return 'Серия не прервана — спасать нечего';
          progress.frozenDays = [...progress.frozenDays, day];
        } else {
          if (progress.inventory.includes(item.id)) return 'Уже куплено';
          progress.inventory = [...progress.inventory, item.id];
          progress.equipped = { ...progress.equipped, [item.slot]: item.id };
        }
        set({ progress });
        get().settle();
        return null;
      },

      equip(itemId) {
        const s = get();
        const item = SHOP_ITEMS.find((i) => i.id === itemId);
        if (!item || item.slot === 'booster') return;
        if (!isUnlocked(item, levelInfo(s.progress.xp).level, s.progress.inventory)) return;
        const current = s.progress.equipped[item.slot];
        const equipped = { ...s.progress.equipped };
        if (current === itemId && item.slot === 'accessory') delete equipped.accessory;
        else equipped[item.slot] = itemId;
        set({ progress: { ...s.progress, equipped } });
      },

      updateSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      updatePortions(portions) {
        set({ portions });
      },

      updateProfile(patch) {
        set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : {}));
        get().settle();
      },

      updateLook(patch) {
        set((s) => ({ look: { ...s.look, ...patch } }));
      },

      settle(now = new Date()) {
        const s = get();
        if (!s.profile) return;
        const r = collectRewards({ profile: s.profile, meals: s.meals, activity: s.activity, weights: s.weights, progress: s.progress }, now);
        if (!r.rewards.length) return;
        set({
          progress: r.progress,
          rewardQueue: [...s.rewardQueue, ...r.rewards],
          levelUp: r.levelUp ?? s.levelUp,
        });
      },

      shiftReward() {
        set({ rewardQueue: [] });
      },

      dismissLevelUp() {
        set({ levelUp: null });
      },

      resetAll() {
        set({ ...INITIAL, rewardQueue: [], levelUp: null });
      },
    }),
    {
      name: 'levelup-state',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Сохраняем только данные: очередь тостов и модалка уровня живут до перезапуска.
      partialize: (s): Data => ({
        onboarded: s.onboarded,
        profile: s.profile,
        look: s.look,
        portions: s.portions,
        meals: s.meals,
        activity: s.activity,
        weights: s.weights,
        progress: s.progress,
        settings: s.settings,
        pending: s.pending,
      }),
    },
  ),
);

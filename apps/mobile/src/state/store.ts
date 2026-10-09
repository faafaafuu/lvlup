import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DateKey, DayActivity, MealDraft, MealLog, MotivationState, Profile, Stake, UserPortions, WeightEntry, dateKey, weekStartOf,
} from '@levelup/domain';
import { newId } from '@/lib/id';

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

export interface ProgressPhoto {
  id: string;
  date: DateKey;
  uri: string;
}

export interface ToastMsg {
  id: string;
  title: string;
  subtitle?: string;
  kind: 'saved' | 'quest' | 'achievement' | 'offline';
}

interface Data {
  onboarded: boolean;
  profile: Profile | null;
  portions: UserPortions;
  meals: MealLog[];
  activity: Record<DateKey, DayActivity>;
  weights: WeightEntry[];
  motivation: MotivationState;
  photos: ProgressPhoto[];
  settings: Settings;
  pending: PendingPhrase[];
}

interface Actions {
  completeOnboarding(profile: Profile, portions: UserPortions, wish: { title: string; price: number } | null, rate: number): void;
  /** Записывает и еду, и активность из одной фразы. Возвращает true, если что-то записано. */
  addEntry(draft: MealDraft, at?: string): boolean;
  deleteMeal(id: string): void;
  deleteSession(date: DateKey, id: string): void;
  addWeight(kg: number, date?: DateKey): void;
  patchActivity(date: DateKey, patch: Partial<DayActivity>): void;
  addPending(text: string): void;
  removePending(id: string): void;
  addWish(title: string, price: number): void;
  removeWish(id: string): void;
  claimWish(id: string): void;
  setRate(rate: number): void;
  addTransfer(amount: number): void;
  addStake(stake: Omit<Stake, 'id' | 'weekStart'>): string | null;
  payStake(id: string): void;
  cancelStake(id: string): void;
  addPhoto(uri: string): void;
  removePhoto(id: string): void;
  updateSettings(patch: Partial<Settings>): void;
  updatePortions(portions: UserPortions): void;
  updateProfile(patch: Partial<Profile>): void;
  showToast(t: Omit<ToastMsg, 'id'>): void;
  hideToast(): void;
  resetAll(): void;
}

export type AppState = Data & Actions & { toast: ToastMsg | null };

const today = () => dateKey(new Date());

const freshMotivation = (): MotivationState => ({ startDate: today(), rates: [{ from: today(), rate: 100 }], wishes: [], transfers: [], stakes: [] });

const INITIAL: Data = {
  onboarded: false,
  profile: null,
  portions: { units: { plate: 300, cup: 250, glass: 250, tbsp: 15 }, foods: {} },
  meals: [],
  activity: {},
  weights: [],
  motivation: freshMotivation(),
  photos: [],
  settings: { apiUrl: '', apiToken: '', theme: 'system', reminders: true, health: false },
  pending: [],
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      toast: null,

      completeOnboarding(profile, portions, wish, rate) {
        const d = today();
        set({
          onboarded: true,
          profile,
          portions,
          weights: [{ date: d, kg: profile.startWeightKg }],
          motivation: {
            ...freshMotivation(),
            rates: [{ from: d, rate }],
            wishes: wish ? [{ id: newId(), title: wish.title, price: wish.price, createdAt: new Date().toISOString() }] : [],
          },
        });
      },

      addEntry(draft, at = new Date().toISOString()) {
        const activities = draft.activities ?? [];
        if (!draft.items.length && !activities.length) return false;
        const day = dateKey(new Date(at));
        set((s) => {
          const patch: Partial<Data> = {};
          if (draft.items.length) {
            patch.meals = [...s.meals, { id: newId(), at, text: draft.sourceText, items: draft.items, totals: draft.totals }];
          }
          if (activities.length) {
            const prev = s.activity[day];
            const sessions = [...(prev?.sessions ?? []), ...activities.map((a) => ({ ...a, id: newId(), at }))];
            patch.activity = { ...s.activity, [day]: { ...prev, date: day, sessions } };
          }
          return patch;
        });
        const parts = [
          draft.items.length ? `~${Math.round(draft.totals.kcal)} ккал` : '',
          activities.length ? `${activities.reduce((n, a) => n + a.minutes, 0)} мин спорта` : '',
        ].filter(Boolean);
        get().showToast({ kind: 'saved', title: 'Записано', subtitle: parts.join(' · ') });
        return true;
      },

      deleteMeal(id) {
        set((s) => ({ meals: s.meals.filter((m) => m.id !== id) }));
      },

      deleteSession(date, id) {
        set((s) => {
          const prev = s.activity[date];
          if (!prev) return {};
          return { activity: { ...s.activity, [date]: { ...prev, sessions: (prev.sessions ?? []).filter((x) => x.id !== id) } } };
        });
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

      addWish(title, price) {
        set((s) => ({ motivation: { ...s.motivation, wishes: [...s.motivation.wishes, { id: newId(), title, price, createdAt: new Date().toISOString() }] } }));
      },

      removeWish(id) {
        set((s) => ({ motivation: { ...s.motivation, wishes: s.motivation.wishes.filter((w) => w.id !== id) } }));
      },

      claimWish(id) {
        set((s) => ({
          motivation: { ...s.motivation, wishes: s.motivation.wishes.map((w) => (w.id === id ? { ...w, claimedAt: new Date().toISOString() } : w)) },
        }));
        get().showToast({ kind: 'achievement', title: 'Награда твоя!', subtitle: 'Заработал честно — забирай' });
      },

      setRate(rate) {
        // Новая ставка действует с сегодняшнего дня, прошлые заработки не пересчитываются.
        const d = today();
        set((s) => ({ motivation: { ...s.motivation, rates: [...s.motivation.rates.filter((r) => r.from !== d), { from: d, rate }] } }));
      },

      addTransfer(amount) {
        set((s) => ({ motivation: { ...s.motivation, transfers: [...s.motivation.transfers, { id: newId(), at: new Date().toISOString(), amount }] } }));
      },

      addStake(stake) {
        const week = weekStartOf(today());
        if (get().motivation.stakes.some((s) => s.weekStart === week)) return 'На эту неделю ставка уже есть';
        set((s) => ({ motivation: { ...s.motivation, stakes: [...s.motivation.stakes, { ...stake, id: newId(), weekStart: week }] } }));
        return null;
      },

      payStake(id) {
        set((s) => ({
          motivation: { ...s.motivation, stakes: s.motivation.stakes.map((k) => (k.id === id ? { ...k, paidAt: new Date().toISOString() } : k)) },
        }));
      },

      cancelStake(id) {
        set((s) => ({ motivation: { ...s.motivation, stakes: s.motivation.stakes.filter((k) => k.id !== id) } }));
      },

      addPhoto(uri) {
        set((s) => ({ photos: [...s.photos, { id: newId(), date: today(), uri }] }));
      },

      removePhoto(id) {
        set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
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

      showToast(t) {
        set({ toast: { ...t, id: newId() } });
      },

      hideToast() {
        set({ toast: null });
      },

      resetAll() {
        set({ ...INITIAL, motivation: freshMotivation(), toast: null });
      },
    }),
    {
      name: 'levelup-state',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 → v2: уровни, монеты и персонаж убраны, вместо них копилка. Записи и вес сохраняются.
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Partial<Data> & Record<string, unknown>;
        if (version < 2) {
          const { progress: _p, look: _l, ...rest } = old as Record<string, unknown>;
          return { ...INITIAL, ...(rest as Partial<Data>), motivation: freshMotivation(), photos: [] } as Data;
        }
        return old as Data;
      },
      partialize: (s): Data => ({
        onboarded: s.onboarded,
        profile: s.profile,
        portions: s.portions,
        meals: s.meals,
        activity: s.activity,
        weights: s.weights,
        motivation: s.motivation,
        photos: s.photos,
        settings: s.settings,
        pending: s.pending,
      }),
    },
  ),
);

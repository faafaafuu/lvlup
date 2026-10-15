import * as Notifications from 'expo-notifications';
import { addDays, dateKey, dayStats, mealDateKey, mealSlot, normOn } from '@levelup/domain';
import { fmt } from '@/lib/format';
import { useStore } from '@/state/store';

/**
 * Только локальные уведомления: удалённые push требуют APNs и платного аккаунта.
 * Напоминания планируются на несколько дней вперёд и пересчитываются после каждой
 * записи: обед уже записан — днём не беспокоим, вечером — сколько осталось.
 */
const DAYS_AHEAD = 4;
const LUNCH = { hour: 13, minute: 30 };
const EVENING = { hour: 20, minute: 0 };

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const at = (day: string, t: { hour: number; minute: number }) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, t.hour, t.minute);
};

function plan(): Array<{ date: Date; title: string; body: string }> {
  const s = useStore.getState();
  if (!s.profile) return [];
  const state = { profile: s.profile, meals: s.meals, activity: s.activity, weights: s.weights };
  const today = dateKey(new Date());
  const out: Array<{ date: Date; title: string; body: string }> = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    const meals = s.meals.filter((m) => mealDateKey(m.at) === day);
    const lunchLogged = meals.some((m) => mealSlot(m.at) === 'Обед');
    if (!lunchLogged) out.push({ date: at(day, LUNCH), title: 'Что было на обед?', body: 'Скажи одной фразой — Хрум посчитает' });
    const left = normOn(state, day) - dayStats(day, s.meals, s.activity[day]).kcal;
    const body = !meals.length
      ? 'Сегодня ещё ничего не записано — нажми на микрофон и перечисли, что ел'
      : left >= 0
        ? `До цели осталось ${fmt(left)} ккал — запиши ужин, если был`
        : `Сегодня сверх плана на ${fmt(-left)} ккал. Завтра — новый день`;
    out.push({ date: at(day, EVENING), title: 'Как прошёл день?', body });
  }
  return out.filter((n) => n.date.getTime() > Date.now() + 60_000);
}

let timer: ReturnType<typeof setTimeout> | null = null;

export async function syncReminders(enabled: boolean): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return true;
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return false;
    for (const n of plan()) {
      await Notifications.scheduleNotificationAsync({
        content: { title: n.title, body: n.body, data: { url: 'levelup://' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.date },
      });
    }
    return true;
  } catch {
    return false;
  }
}

/** Пересчитать после изменений в записях — не чаще раза в пару секунд. */
export function startReminderSync() {
  let meals = useStore.getState().meals;
  return useStore.subscribe((s) => {
    if (s.meals === meals || !s.onboarded) return;
    meals = s.meals;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncReminders(useStore.getState().settings.reminders), 2000);
  });
}

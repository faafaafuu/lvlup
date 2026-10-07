import * as Notifications from 'expo-notifications';

/**
 * Только локальные уведомления: удалённые push требуют APNs и платного аккаунта.
 * Напоминания планирует сам телефон — сервер для этого не нужен.
 */
const REMINDERS: Array<{ hour: number; minute: number; title: string; body: string }> = [
  { hour: 13, minute: 30, title: 'Что было на обед?', body: 'Скажи одной фразой — герой получит +10 XP' },
  { hour: 20, minute: 0, title: 'Квесты дня ждут', body: 'Загляни, что осталось до сундука' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function syncReminders(enabled: boolean): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return true;
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return false;
    for (const r of REMINDERS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute },
      });
    }
    return true;
  } catch {
    return false;
  }
}

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { addDays, dateKey } from '@levelup/domain';
import { LevelUpModal } from '@/components/LevelUpModal';
import { RewardToast } from '@/components/RewardToast';
import { readHealthDay, readLatestWeight } from '@/lib/health';
import { syncReminders } from '@/lib/notifications';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

/** Подтягивает шаги/сон/вес из Здоровья и начисляет то, что набежало, пока приложение было закрыто. */
async function refresh() {
  const s = useStore.getState();
  if (!s.onboarded) return;
  if (s.settings.health) {
    const today = dateKey(new Date());
    for (const day of [addDays(today, -1), today]) {
      const h = await readHealthDay(day);
      const patch: { steps?: number; sleepHours?: number } = {};
      if (h.steps != null) patch.steps = h.steps;
      if (h.sleepHours != null) patch.sleepHours = h.sleepHours;
      if (Object.keys(patch).length) useStore.getState().patchActivity(day, patch);
    }
    const w = await readLatestWeight();
    if (w) {
      const key = dateKey(w.date);
      const known = useStore.getState().weights.find((x) => x.date === key);
      if (!known || known.kg !== w.kg) useStore.getState().addWeight(w.kg, key);
    }
  }
  useStore.getState().settle();
}

export default function RootLayout() {
  const { c, dark } = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  const reminders = useStore((s) => s.settings.reminders);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && void refresh());
    return () => sub.remove();
  }, [onboarded]);

  useEffect(() => {
    if (onboarded) void syncReminders(reminders);
  }, [onboarded, reminders]);

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings"
            options={{ presentation: 'modal', headerShown: true, title: 'Настройки', headerStyle: { backgroundColor: c.bg }, headerTintColor: c.text }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <RewardToast />
      <LevelUpModal />
    </SafeAreaProvider>
  );
}

import { useEffect } from 'react';
import { Unbounded_500Medium } from '@expo-google-fonts/unbounded/500Medium';
import { Unbounded_700Bold } from '@expo-google-fonts/unbounded/700Bold';
import { useFonts } from 'expo-font';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ACTIVITY_BY_ID, activityKcal, addDays, currentWeight, dateKey } from '@levelup/domain';
import { AppToast } from '@/components/AppToast';
import { readHealthDay, readHealthWorkouts, readLatestWeight } from '@/lib/health';
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

      // Тренировки с часов/из фитнес-приложений — без дублей: id из HealthKit.
      const st = useStore.getState();
      const known = new Set((st.activity[day]?.sessions ?? []).map((x) => x.id));
      const kg = st.profile ? currentWeight(st.profile, st.weights) : 75;
      const fresh = (await readHealthWorkouts(day))
        .filter((w) => !known.has(w.id))
        .map((w) => {
          const def = ACTIVITY_BY_ID.get(w.activityId)!;
          return { id: w.id, at: w.at, activityId: def.id, name: def.name, text: 'Здоровье', minutes: w.minutes, reps: null, weightKg: null, assumed: false, kcal: w.kcal ?? activityKcal(def, w.minutes, kg) };
        });
      if (fresh.length) st.patchActivity(day, { sessions: [...(st.activity[day]?.sessions ?? []), ...fresh] });
    }
    const w = await readLatestWeight();
    if (w) {
      const key = dateKey(w.date);
      const known = useStore.getState().weights.find((x) => x.date === key);
      if (!known || known.kg !== w.kg) useStore.getState().addWeight(w.kg, key);
    }
  }
}

export default function RootLayout() {
  const { c, dark } = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  const reminders = useStore((s) => s.settings.reminders);
  const [fontsLoaded, fontError] = useFonts({ Unbounded_700Bold, Unbounded_500Medium });

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && void refresh());
    return () => sub.remove();
  }, [onboarded]);

  useEffect(() => {
    if (onboarded) void syncReminders(reminders);
  }, [onboarded, reminders]);

  // Шрифт не загрузился (нет сети при первом запуске dev-сборки) — работаем на системном.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="log" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen
            name="settings"
            options={{ presentation: 'modal', headerShown: true, title: 'Настройки', headerStyle: { backgroundColor: c.bg }, headerTintColor: c.text }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <AppToast />
    </SafeAreaProvider>
  );
}

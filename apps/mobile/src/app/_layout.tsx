import { useEffect } from 'react';
import { Geologica_600SemiBold } from '@expo-google-fonts/geologica/600SemiBold';
import { Geologica_700Bold } from '@expo-google-fonts/geologica/700Bold';
import { useFonts } from 'expo-font';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppToast } from '@/components/AppToast';
import { syncHealth } from '@/lib/healthSync';
import { syncReminders } from '@/lib/notifications';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

/** При открытии: последние 3 дня из Здоровья (первый раз — 30, чтобы появилась история). */
async function refresh() {
  const s = useStore.getState();
  if (!s.onboarded || !s.settings.health) return;
  await syncHealth(s.settings.healthSyncedAt ? 3 : 30);
}

export default function RootLayout() {
  const { c, dark } = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  const reminders = useStore((s) => s.settings.reminders);
  const [fontsLoaded, fontError] = useFonts({ Geologica_600SemiBold, Geologica_700Bold });

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
        <Stack.Screen name="connect" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
      <AppToast />
    </SafeAreaProvider>
  );
}

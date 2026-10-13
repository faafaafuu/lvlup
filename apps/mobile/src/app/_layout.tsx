import { useEffect } from 'react';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { Unbounded_200ExtraLight } from '@expo-google-fonts/unbounded/200ExtraLight';
import { Unbounded_300Light } from '@expo-google-fonts/unbounded/300Light';
import { Unbounded_400Regular } from '@expo-google-fonts/unbounded/400Regular';
import { useFonts } from 'expo-font';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CaptureHost } from '@/components/CaptureHost';
import { RewardModal } from '@/components/RewardModal';
import { syncHealth } from '@/lib/healthSync';
import { startLiveSync } from '@/lib/live';
import { syncReminders } from '@/lib/notifications';
import { useStore } from '@/state/store';
import { useTheme } from '@/ui/theme';

/** При открытии: последние 3 дня из Здоровья (первый раз — 30, чтобы появилась история). */
async function refresh() {
  const s = useStore.getState();
  if (!s.onboarded || !s.settings.health) return;
  await syncHealth(s.settings.healthSyncedAt ? 3 : 30);
}

export default function RootLayout() {
  const t = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  const reminders = useStore((s) => s.settings.reminders);
  const [fontsLoaded, fontError] = useFonts({
    Unbounded_200ExtraLight, Unbounded_300Light, Unbounded_400Regular, JetBrainsMono_400Regular, JetBrainsMono_500Medium,
  });

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && void refresh());
    return () => sub.remove();
  }, [onboarded]);

  // Виджеты и Dynamic Island следят за стором сами.
  useEffect(() => startLiveSync(), []);

  useEffect(() => {
    if (onboarded) void syncReminders(reminders);
  }, [onboarded, reminders]);

  // Шрифты не загрузились — работаем на системном, а не висим на пустом экране.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={t.light && t.name === 'carpet' ? 'dark' : 'light'} />
      <CaptureHost>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: 'fade' }}>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="index" />
            <Stack.Screen name="diary" />
            <Stack.Screen name="progress" />
            <Stack.Screen name="level" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="log" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="voice" options={{ animation: 'none' }} />
          </Stack.Protected>
          {/* Онбординг раньше «connect»: без профиля роутер открывает первый доступный экран. */}
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Screen name="connect" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        </Stack>
        <RewardModal />
      </CaptureHost>
    </SafeAreaProvider>
  );
}

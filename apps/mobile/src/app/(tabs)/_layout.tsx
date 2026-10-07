import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';

const icon = (glyph: string) => ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>;

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Герой', tabBarIcon: icon('🛡') }} />
      <Tabs.Screen name="diary" options={{ title: 'Дневник', tabBarIcon: icon('📖') }} />
      <Tabs.Screen name="progress" options={{ title: 'Прогресс', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="rewards" options={{ title: 'Награды', tabBarIcon: icon('🏆') }} />
    </Tabs>
  );
}

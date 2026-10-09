import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { useTheme } from '@/theme';

const icon = (name: IconName) => ({ focused, color }: { focused: boolean; color: ColorValue }) => <Icon name={name} color={String(color)} filled={focused} />;

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
      <Tabs.Screen name="index" options={{ title: 'Сегодня', tabBarIcon: icon('sun') }} />
      <Tabs.Screen name="diary" options={{ title: 'Дневник', tabBarIcon: icon('tabDiary') }} />
      <Tabs.Screen name="progress" options={{ title: 'Ты', tabBarIcon: icon('user') }} />
      <Tabs.Screen name="rewards" options={{ title: 'Копилка', tabBarIcon: icon('coin') }} />
    </Tabs>
  );
}

import { Tabs } from 'expo-router';
import { CaptureHost, useCapture } from '@/components/CaptureHost';
import { TabBar, TabId } from '@/design/TabBar';
import { useTheme } from '@/theme';

const ROUTE_TO_TAB: Record<string, TabId> = { index: 'today', diary: 'diary', progress: 'progress', rewards: 'rewards' };
const TAB_TO_ROUTE: Record<TabId, string> = { today: 'index', diary: 'diary', progress: 'progress', rewards: 'rewards' };

/** Плавающий стеклянный таб-бар из дизайна + микрофон, который работает с любой вкладки. */
function GlassTabBar({ state, navigation }: { state: { index: number; routes: Array<{ name: string }> }; navigation: { navigate: (name: string) => void } }) {
  const t = useTheme();
  const capture = useCapture();
  const active = ROUTE_TO_TAB[state.routes[state.index]?.name ?? 'index'] ?? 'today';
  return <TabBar t={t} active={active} onChange={(id) => navigation.navigate(TAB_TO_ROUTE[id])} onMic={capture.toggleVoice} recording={capture.recording} />;
}

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <CaptureHost>
      <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }} tabBar={(props) => <GlassTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="diary" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="rewards" />
      </Tabs>
    </CaptureHost>
  );
}

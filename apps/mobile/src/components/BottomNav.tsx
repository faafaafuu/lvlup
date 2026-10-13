import { Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/design/Icon';
import { tap } from '@/lib/haptics';
import { Circ } from '@/ui/kit';
import { useTheme } from '@/ui/theme';
import { useCapture } from './CaptureHost';

export const NAV_SPACE = 150;

/** Низ экрана из макета: дневник · микрофон · прогресс. Микрофон пишет в открытый день. */
export function BottomNav({ active }: { active?: 'diary' | 'progress' }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const capture = useCapture();
  const { width } = useWindowDimensions();
  const go = (path: '/diary' | '/progress') => (active ? router.replace(path) : router.push(path));
  const bottom = Math.max(insets.bottom, 12) + 6;
  return (
    <>
    {/* Затухание фона под кнопками — список плавно уходит под них, а не наезжает. */}
    <Svg pointerEvents="none" width={width} height={bottom + 130} style={{ position: 'absolute', left: 0, bottom: 0 }}>
      <Defs>
        <LinearGradient id="navfade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.bg} stopOpacity={0} />
          <Stop offset="0.45" stopColor={t.bg} stopOpacity={0.92} />
          <Stop offset="1" stopColor={t.bg} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={bottom + 130} fill="url(#navfade)" />
    </Svg>
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44 }}
    >
      <Circ icon="tabDiary" label="Дневник" active={active === 'diary'} size={50} onPress={() => go('/diary')} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={capture.recording ? 'Остановить запись' : 'Записать голосом'}
        onPress={() => {
          tap();
          capture.toggleVoice();
        }}
        style={({ pressed }) => ({
          width: 76, height: 76, borderRadius: 38, backgroundColor: t.cta, alignItems: 'center', justifyContent: 'center',
          shadowColor: t.ctaGlow, shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Icon name="mic" size={28} strokeWidth={2} color={t.onCta} />
      </Pressable>
      <Circ icon="tabProgress" label="Прогресс" active={active === 'progress'} size={50} onPress={() => go('/progress')} />
    </View>
    </>
  );
}

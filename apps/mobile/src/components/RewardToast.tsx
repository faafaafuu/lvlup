import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';
import { success } from '@/lib/haptics';
import { Row, T } from './ui';

const KIND_ICON = { meal: '🍽', activity: '⚡', quest: '✅', chest: '🎁', achievement: '🏆', streak: '🔥' } as const;

/** Показывает награды из очереди по одной: «Запись еды · +10 XP». */
export function RewardToast() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reward = useStore((s) => s.rewardQueue[0]);
  const shift = useStore((s) => s.shiftReward);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!reward) return;
    success();
    anim.setValue(0);
    const seq = Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(1300),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    seq.start(({ finished }) => finished && shift());
    return () => seq.stop();
  }, [reward, anim, shift]);

  if (!reward) return null;
  const parts = [reward.xp ? `+${reward.xp} XP` : '', reward.coins ? `+${reward.coins} монет` : ''].filter(Boolean).join(' · ');

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 10,
        opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
      }}
    >
      <Row style={{ backgroundColor: c.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.xp, gap: 10 }}>
        <T size="lg">{KIND_ICON[reward.kind]}</T>
        <T bold style={{ flex: 1 }}>
          {reward.title}
        </T>
        <T bold tone="xp">
          {parts}
        </T>
      </Row>
    </Animated.View>
  );
}

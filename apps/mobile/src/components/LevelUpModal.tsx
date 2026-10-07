import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, View } from 'react-native';
import { SHOP_ITEMS, titleFor } from '@levelup/domain';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useTheme } from '@/theme';
import { heavy } from '@/lib/haptics';
import { Avatar } from './Avatar';
import { Btn, T } from './ui';

const COLORS = ['#7C5CFF', '#3EE58F', '#FFC83D', '#FF8A3D', '#5AA9FF', '#FF5D6C'];

export function LevelUpModal() {
  const { c } = useTheme();
  const level = useStore((s) => s.levelUp);
  const dismiss = useStore((s) => s.dismissLevelUp);
  const profile = useStore((s) => s.profile);
  const look = useStore((s) => s.look);
  const equipped = useStore((s) => s.progress.equipped);
  const game = useGame();

  useEffect(() => {
    if (level) heavy();
  }, [level]);

  if (!level || !profile) return null;
  const unlocked = SHOP_ITEMS.filter((i) => i.unlockLevel === level);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: '#000D', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Confetti />
        <Avatar sex={profile.sex} look={look} stage={game?.stage ?? 0} outfitId={equipped.outfit} accessoryId={equipped.accessory} pose="cheer" size={160} />
        <T size="xxl" bold style={{ color: '#fff' }}>
          Уровень {level}!
        </T>
        <T size="lg" style={{ color: c.xp }}>
          Новый титул: {titleFor(level)}
        </T>
        {unlocked.map((i) => (
          <T key={i.id} style={{ color: '#fff' }}>
            Открыто: {i.name}
          </T>
        ))}
        <Btn title="Круто!" onPress={dismiss} style={{ alignSelf: 'stretch', marginTop: 12 }} />
      </View>
    </Modal>
  );
}

function Confetti() {
  const { width, height } = Dimensions.get('window');
  const pieces = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ x: Math.random() * width, delay: Math.random() * 400, color: COLORS[i % COLORS.length]!, rot: Math.random() * 360 })),
    [width],
  );
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fall, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fall]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', left: p.x, top: -20, width: 10, height: 14, borderRadius: 2, backgroundColor: p.color,
            transform: [
              { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, height * (0.6 + (i % 5) * 0.08)] }) },
              { rotate: `${p.rot}deg` },
            ],
            opacity: fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
          }}
        />
      ))}
    </View>
  );
}

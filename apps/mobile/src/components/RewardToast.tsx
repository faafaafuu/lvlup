import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/design/components';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

const KIND = { meal: 'saved', activity: 'saved', quest: 'quest', chest: 'quest', achievement: 'achievement', streak: 'saved' } as const;

/** Награды из очереди по одной, тост из дизайна: «Запись еды · +10 XP». */
export function RewardToast() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reward = useStore((s) => s.rewardQueue[0]);
  const shift = useStore((s) => s.shiftReward);
  if (!reward) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, zIndex: 10 }}>
      <Toast key={reward.key} t={t} kind={KIND[reward.kind]} title={reward.title} reward={reward.xp || undefined} coins={reward.coins || undefined} onHide={shift} />
    </View>
  );
}

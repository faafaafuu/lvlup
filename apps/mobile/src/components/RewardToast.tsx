import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/design/components';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

/**
 * Один тост на одно действие: запись еды, квест и достижение, выданные вместе,
 * складываются в «Запись еды и ещё 2 · +135 XP · +25 монет», а не идут очередью.
 */
export function RewardToast() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const rewards = useStore((s) => s.rewardQueue);
  const clear = useStore((s) => s.shiftReward);
  const first = rewards[0];
  if (!first) return null;
  const xp = rewards.reduce((n, r) => n + r.xp, 0);
  const coins = rewards.reduce((n, r) => n + r.coins, 0);
  const kind = rewards.some((r) => r.kind === 'achievement') ? 'achievement' : rewards.some((r) => r.kind === 'quest' || r.kind === 'chest') ? 'quest' : 'saved';
  const headline = rewards.find((r) => r.kind === 'achievement') ?? first;
  const extra = rewards.length - 1;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, zIndex: 10 }}>
      <Toast
        key={first.key}
        t={t}
        kind={kind}
        title={headline.title}
        subtitle={extra > 0 ? `и ещё ${extra} ${extra === 1 ? 'награда' : extra < 5 ? 'награды' : 'наград'}` : undefined}
        reward={xp || undefined}
        coins={coins || undefined}
        onHide={clear}
      />
    </View>
  );
}

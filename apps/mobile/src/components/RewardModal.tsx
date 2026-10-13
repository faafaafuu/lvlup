import { useEffect, useRef } from 'react';
import { Animated, Modal, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { XP_PER_LEVEL } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { success } from '@/lib/haptics';
import { fmt, plural } from '@/lib/format';
import { useStore } from '@/state/store';
import { Bar, Card, Cta, Lbl, Num, Row, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

/** «Записано · награда» из макета: +опыт в светящемся круге, уровень, серия, монеты. */
export function RewardModal() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reward = useStore((s) => s.reward);
  const haptics = useStore((s) => s.settings.rewardHaptics);
  const clear = useStore((s) => s.clearReward);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!reward) return;
    if (haptics) success();
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, damping: 12, stiffness: 160, useNativeDriver: true }).start();
  }, [reward, haptics, pop]);

  if (!reward) return null;
  const D = Math.min(220, width - 160);
  const left = reward.kcalLeft;
  const line =
    reward.slot === 'Тренировка'
      ? 'Тренировка записана.'
      : `${reward.slot} записан. ${left >= 0 ? `На сегодня ещё ${fmt(left)} ккал.` : 'Сегодня чуть выше плана — это нормально.'}`;

  return (
    <Modal visible animationType="fade" onRequestClose={clear}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 40, paddingHorizontal: 32, alignItems: 'center' }}>
        <Animated.View style={{ width: D + 120, height: D + 120, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}>
          <Svg width={D + 120} height={D + 120} style={{ position: 'absolute' }}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0.55" stopColor={t.xp} stopOpacity={0.22} />
                <Stop offset="1" stopColor={t.xp} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={(D + 120) / 2} cy={(D + 120) / 2} r={(D + 120) / 2} fill="url(#glow)" />
            <Circle cx={(D + 120) / 2} cy={(D + 120) / 2} r={D / 2} fill={t.bg} stroke={t.ln} strokeWidth={1} />
          </Svg>
          <Num size={84}>{reward.xp > 0 ? `+${reward.xp}` : '0'}</Num>
          <Lbl>{reward.xp > 0 ? 'опыт' : 'лимит опыта на день'}</Lbl>
        </Animated.View>

        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 16 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Lbl>LV {String(reward.level).padStart(2, '0')}{reward.levelUp ? ' · новый уровень!' : ''}</Lbl>
            <Lbl>
              {reward.levelXp} / {XP_PER_LEVEL}
            </Lbl>
          </Row>
          <Bar value={reward.levelXp / XP_PER_LEVEL} color={t.xp} />
        </View>

        <Row style={{ alignSelf: 'stretch', marginTop: 28 }}>
          <Card style={{ flex: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="streak" size={24} color={t.food} />
            <View>
              <Txt size={20} weight="300">
                {reward.streak} {plural(reward.streak, 'день', 'дня', 'дней')}
              </Txt>
              <Txt size={14} muted>
                подряд
              </Txt>
            </View>
          </Card>
          <Card style={{ flex: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="coin" size={24} color={t.coin} />
            <View>
              <Txt size={20} weight="300">
                {reward.coins > 0 ? `+${reward.coins}` : fmt(reward.totalCoins)}
              </Txt>
              <Txt size={14} muted>
                {reward.coins > 0 ? plural(reward.coins, 'монета', 'монеты', 'монет') : 'монет всего'}
              </Txt>
            </View>
          </Card>
        </Row>

        <Txt size={16} muted style={{ textAlign: 'center', marginTop: 28 }}>
          {line}
        </Txt>

        <Cta title="Готово" onPress={clear} style={{ position: 'absolute', left: 24, right: 24, bottom: Math.max(insets.bottom, 16) + 8 }} />
      </View>
    </Modal>
  );
}

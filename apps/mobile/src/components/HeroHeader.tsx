import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LevelInfo } from '@levelup/domain';
import { LevelBadge, XPBar } from '@/design/components';
import { Icon } from '@/design/Icon';
import { useTheme } from '@/theme';
import { fmt } from '@/lib/format';
import { Row, T } from './ui';

export function HeroHeader({ level, coins, streak, doubleXp }: { level: LevelInfo; coins: number; streak: number; doubleXp: boolean }) {
  const t = useTheme();
  const { c } = t;
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10}>
          <LevelBadge t={t} level={level.level} onPress={() => router.push('/rewards')} />
          <View>
            <T bold display size="md">
              {level.title}
            </T>
            <T size="xs" tone="muted">
              Уровень {level.level}
              {doubleXp ? ' · ×2 XP сегодня' : ''}
            </T>
          </View>
        </Row>
        <Row gap={14}>
          <Row gap={4} accessibilityLabel={`Монеты: ${coins}`}>
            <Icon name="coin" size={18} color={c.coin} />
            <T bold tone="coin">
              {fmt(coins)}
            </T>
          </Row>
          <Row gap={4} accessibilityLabel={`Серия дней: ${streak}`}>
            <Icon name="streak" size={18} color={c.streak} />
            <T bold tone="streak">
              {streak}
            </T>
          </Row>
          <Pressable accessibilityLabel="Настройки" hitSlop={12} onPress={() => router.push('/settings')}>
            <Icon name="gear" size={22} color={c.textMuted} />
          </Pressable>
        </Row>
      </Row>
      <XPBar t={t} value={level.current} max={level.needed} />
    </View>
  );
}

import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LevelInfo } from '@levelup/domain';
import { useTheme } from '@/theme';
import { fmt } from '@/lib/format';
import { Bar, Row, T } from './ui';

export function HeroHeader({ level, coins, streak, doubleXp }: { level: LevelInfo; coins: number; streak: number; doubleXp: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
            <T size="lg" bold style={{ color: c.onPrimary }}>
              {level.level}
            </T>
          </View>
          <View>
            <T bold>{level.title}</T>
            <T size="xs" tone="muted">
              Уровень {level.level}
              {doubleXp ? ' · ×2 XP сегодня' : ''}
            </T>
          </View>
        </Row>
        <Row gap={14}>
          <T bold tone="coin" accessibilityLabel={`Монеты: ${coins}`}>
            ● {fmt(coins)}
          </T>
          <T bold tone="streak" accessibilityLabel={`Серия дней: ${streak}`}>
            🔥 {streak}
          </T>
          <Pressable accessibilityLabel="Настройки" hitSlop={10} onPress={() => router.push('/settings')}>
            <T size="lg" tone="muted">
              ⚙︎
            </T>
          </Pressable>
        </Row>
      </Row>
      <Bar value={level.current} max={level.needed} color={c.xp} height={10} />
      <T size="xs" tone="muted" style={{ alignSelf: 'flex-end' }}>
        {fmt(level.current)} / {fmt(level.needed)} XP
      </T>
    </View>
  );
}

import { View } from 'react-native';
import { YouStat } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { useTheme } from '@/theme';
import { Bar, Card, Row, T } from './ui';

const ICON: Record<YouStat['id'], IconName> = { discipline: 'streak', strength: 'workout', endurance: 'steps', shape: 'weight' };

/** Четыре реальные характеристики вместо персонажа: что растёт, а что нет. */
export function YouStats({ stats }: { stats: YouStat[] }) {
  const t = useTheme();
  const { c } = t;
  const color: Record<YouStat['id'], string> = { discipline: c.streak, strength: c.primary, endurance: c.xp, shape: c.success };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {stats.map((s) => {
        const delta = s.value - s.previous;
        return (
          <Card key={s.id} style={{ width: '47%', flexGrow: 1, gap: 6, padding: 16, minHeight: 156 }}>
            <Row gap={6}>
              <Icon name={ICON[s.id]} size={18} color={color[s.id]} />
              <T bold size="sm">
                {s.title}
              </T>
            </Row>
            <Row style={{ alignItems: 'flex-end' }} gap={6}>
              <T bold display size="xl">
                {s.value}
              </T>
              {delta !== 0 && (
                <T size="xs" bold tone={delta > 0 ? 'success' : 'muted'} style={{ marginBottom: 4 }}>
                  {delta > 0 ? `▲ ${delta}` : `▼ ${-delta}`}
                </T>
              )}
            </Row>
            <Bar value={s.value} max={100} color={color[s.id]} height={6} />
            <T size="xs" tone="muted" numberOfLines={2}>
              {s.detail}
            </T>
          </Card>
        );
      })}
    </View>
  );
}

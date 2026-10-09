import { View } from 'react-native';
import { DayResult, rateOn } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';
import { fmt } from '@/lib/format';
import { Card, Row, T } from './ui';

const ICON: Record<string, IconName> = { logged: 'plate', plan: 'weight', moved: 'steps' };

/** Три условия хорошего дня и сколько он принесёт в копилку. */
export function DayCard({ day }: { day: DayResult }) {
  const { c } = useTheme();
  const rates = useStore((s) => s.motivation.rates);
  const rate = rateOn(rates, day.date);
  const reward = day.score === 3 ? rate : day.good ? Math.round(rate / 2) : 0;
  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T bold display>
          {day.score === 3 ? 'Идеальный день' : day.good ? 'Хороший день' : 'День в процессе'}
        </T>
        <T bold tone={reward ? 'success' : 'muted'}>
          {reward ? `+${fmt(reward)} ₽` : `до +${fmt(rate)} ₽`}
        </T>
      </Row>
      {day.checks.map((ch) => (
        <Row key={ch.id} gap={12}>
          <View
            style={{
              width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
              backgroundColor: ch.done ? c.successSoft : c.surfaceAlt,
            }}
          >
            <Icon name={ch.done ? 'check' : ICON[ch.id] ?? 'star'} size={18} color={ch.done ? c.success : c.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <T bold>{ch.title}</T>
            <T size="xs" tone="muted">
              {ch.detail}
            </T>
          </View>
        </Row>
      ))}
      <T size="xs" tone="muted">
        Все три — {fmt(rate)} ₽ в копилку, два (с записью питания) — половина. Засчитывается в полночь.
      </T>
    </Card>
  );
}

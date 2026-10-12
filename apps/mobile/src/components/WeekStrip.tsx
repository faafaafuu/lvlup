import { Pressable, View } from 'react-native';
import { DateKey, addDays, weekStartOf } from '@levelup/domain';
import { Ring } from '@/design/components';
import { Icon } from '@/design/Icon';
import { useTheme } from '@/theme';
import { Row, T } from './ui';

const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Неделя-календарь: тап по дню открывает его, стрелки листают недели.
 * Кольцо вокруг числа — сколько условий хорошего дня выполнено (0–3).
 */
export function WeekStrip({ selected, today, scoreOf, onSelect }: {
  selected: DateKey;
  today: DateKey;
  scoreOf: (d: DateKey) => number;
  onSelect: (d: DateKey) => void;
}) {
  const t = useTheme();
  const { c } = t;
  const start = weekStartOf(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const canNext = addDays(start, 7) <= today;

  return (
    <Row gap={2} style={{ justifyContent: 'space-between' }}>
      <Pressable accessibilityLabel="Прошлая неделя" hitSlop={10} onPress={() => onSelect(addDays(selected, -7))} style={{ padding: 4 }}>
        <Icon name="chevronLeft" size={20} color={c.textMuted} />
      </Pressable>
      {days.map((d, i) => {
        const future = d > today;
        const on = d === selected;
        const score = future ? 0 : scoreOf(d);
        return (
          <Pressable
            key={d}
            disabled={future}
            onPress={() => onSelect(d)}
            accessibilityLabel={`${DOW[i]} ${Number(d.slice(8))}`}
            accessibilityState={{ selected: on }}
            style={{ alignItems: 'center', gap: 4, opacity: future ? 0.3 : 1 }}
          >
            <T size="xs" tone={on ? 'text' : 'muted'} bold={on}>
              {DOW[i]}
            </T>
            <Ring t={t} value={score / 3} size={38} stroke={3} fill={on ? c.btn : 'none'}>
              <T size="sm" bold style={{ color: on ? c.onBtn : d === today ? c.accentText : c.text }}>
                {Number(d.slice(8))}
              </T>
            </Ring>
          </Pressable>
        );
      })}
      <Pressable accessibilityLabel="Следующая неделя" hitSlop={10} disabled={!canNext} onPress={() => onSelect(addDays(selected, 7))} style={{ padding: 4, opacity: canNext ? 1 : 0.2 }}>
        <Icon name="chevronRight" size={20} color={c.textMuted} />
      </Pressable>
    </Row>
  );
}

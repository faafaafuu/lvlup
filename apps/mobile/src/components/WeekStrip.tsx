import { Pressable, StyleSheet, View } from 'react-native';
import { DateKey, addDays, weekStartOf } from '@levelup/domain';
import { Lbl, Num } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/** Неделя из макета дневника: выбранный день — плашка, точка — есть записи. */
export function WeekStrip({ selected, today, hasEntries, onSelect }: { selected: DateKey; today: DateKey; hasEntries: (d: DateKey) => boolean; onSelect: (d: DateKey) => void }) {
  const t = useTheme();
  const start = weekStartOf(selected);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d, i) => {
        const on = d === selected;
        const future = d > today;
        return (
          <Pressable
            key={d}
            disabled={future}
            onPress={() => onSelect(d)}
            accessibilityLabel={`${DOW[i]} ${Number(d.slice(8))}`}
            accessibilityState={{ selected: on }}
            style={{
              width: 46, paddingVertical: 10, borderRadius: 22, alignItems: 'center', gap: 6,
              backgroundColor: on ? t.sf2 : 'transparent', borderWidth: on ? StyleSheet.hairlineWidth : 0, borderColor: t.ln, opacity: future ? 0.35 : 1,
            }}
          >
            <Lbl color={on ? t.tx : t.mu}>{DOW[i]}</Lbl>
            <Num size={16} color={on || d === today ? t.tx : t.mu}>
              {Number(d.slice(8))}
            </Num>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: hasEntries(d) ? t.food : 'transparent' }} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Неделя назад / вперёд — чтобы листать календарь. */
export const shiftWeek = (d: DateKey, weeks: number) => addDays(d, weeks * 7);

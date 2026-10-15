import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { usePager } from '@/components/Pager';
import { XP_PER_LEVEL, dateKey, mealDateKey } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { fmt, timeOf } from '@/lib/format';
import { useDay } from '@/state/useDay';
import { useStore } from '@/state/store';
import { Card, Lbl, Num, Pill, Rings, Row, Screen, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const DOW = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MON = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЯ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];

/** Главный экран из макета: три кольца (еда · шаги · опыт), остаток калорий, последняя запись. */
export function HomePage() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  // Главный экран всегда про сегодня, независимо от дня, открытого в дневнике.
  const d = useDay(dateKey(new Date()));
  const meals = useStore((s) => s.meals);
  const profile = useStore((s) => s.profile);
  const setViewDate = useStore((s) => s.setViewDate);
  const pager = usePager();
  if (!d || !profile) return null;

  const today = d.today;
  const day = d;
  const now = new Date();
  const left = day.norm - day.stats.kcal;
  const last = meals.filter((m) => mealDateKey(m.at) === today).sort((a, b) => b.at.localeCompare(a.at))[0];
  const size = Math.min(320, width - 70);

  return (
    <Screen>
      <Row style={{ paddingHorizontal: 24, height: 44, justifyContent: 'space-between' }}>
        <Lbl style={{ fontSize: 12 }}>
          {DOW[now.getDay()]} · {now.getDate()} {MON[now.getMonth()]}
        </Lbl>
        <Row gap={8}>
          <Pill label="Настройки" onPress={() => router.push('/settings')}>
            <Icon name="settings" size={16} strokeWidth={1.6} color={t.tx} />
          </Pill>
          <Pill label={`Уровень ${d.game.level}`} onPress={() => router.push('/level')}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.xp }} />
            <Lbl color={t.tx}>LV {String(d.game.level).padStart(2, '0')}</Lbl>
          </Pill>
        </Row>
      </Row>

      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Pressable
          accessibilityLabel="Открыть дневник за сегодня"
          onPress={() => {
            setViewDate(today);
            pager.go(0);
          }}
        >
        <Rings size={size} food={day.stats.kcal / day.norm} steps={day.stats.steps / profile.stepsGoal} xp={d.game.levelXp / XP_PER_LEVEL}>
          <Num size={Math.round(size * (Math.abs(left) >= 1000 ? 0.16 : 0.19))}>{fmt(Math.abs(left))}</Num>
          <Lbl style={{ fontSize: 12, letterSpacing: 2.4, marginTop: 4 }}>{left >= 0 ? 'ккал осталось' : 'ккал сверх плана'}</Lbl>
        </Rings>
        </Pressable>
      </View>

      <Row style={{ paddingHorizontal: 28, marginTop: 32, justifyContent: 'space-between' }}>
        <Legend color={t.food} label="Еда" value={fmt(day.stats.kcal)} of={fmt(day.norm)} onPress={() => (setViewDate(today), pager.go(0))} />
        <Legend color={t.steps} label="Шаги" value={fmt(day.stats.steps)} center onPress={() => pager.go(2)} />
        <Legend color={t.xp} label="Опыт" value={String(d.game.levelXp)} of={String(XP_PER_LEVEL)} right onPress={() => router.push('/level')} />
      </Row>

      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <Card
          onPress={() => {
            if (last) return router.push({ pathname: '/entry/[id]', params: { id: last.id } });
            setViewDate(today);
            pager.go(0);
          }}
          style={{ height: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          {last ? (
            <>
              <Lbl style={{ fontSize: 12 }}>{timeOf(last.at)}</Lbl>
              <Txt style={{ flex: 1 }} numberOfLines={1}>
                {last.items.map((i) => i.name).join(', ')}
              </Txt>
              <Num size={17}>
                {fmt(last.totals.kcal)}
                <Lbl> ккал</Lbl>
              </Num>
            </>
          ) : (
            <Txt muted style={{ flex: 1 }}>
              Скажи, что съел — нажми на микрофон
            </Txt>
          )}
          <Icon name="chevronRight" size={18} color={t.mu} />
        </Card>
      </View>

    </Screen>
  );
}

function Legend({ color, label, value, of, center, right, onPress }: { color: string; label: string; value: string; of?: string; center?: boolean; right?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => ({ gap: 8, alignItems: center ? 'center' : right ? 'flex-end' : 'flex-start', opacity: pressed ? 0.6 : 1 })}>
      <Row gap={8}>
        <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: color }} />
        <Lbl>{label}</Lbl>
      </Row>
      <Num size={18}>
        {value}
        {of ? <Num size={13} weight={300} style={{ opacity: 0.6 }}>/{of}</Num> : null}
      </Num>
    </Pressable>
  );
}

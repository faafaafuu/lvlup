import { useMemo, useState } from 'react';
import { Alert, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { DateKey, addDays, dayStats, dayXp, normOn, smoothWeights, weekStartOf } from '@levelup/domain';
import { BottomNav, NAV_SPACE } from '@/components/BottomNav';
import { fmt, plural } from '@/lib/format';
import { useDay } from '@/state/useDay';
import { useStore } from '@/state/store';
import { Card, Lbl, Num, Row, Screen, Seg, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/** Прогресс из макета: среднее за день, столбцы калорий с линией цели, четыре плитки. */
export default function Progress() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const d = useDay();
  const weights = useStore((s) => s.weights);
  const [period, setPeriod] = useState(0);

  const data = useMemo(() => {
    if (!d) return null;
    const { state, today } = d;
    const days: DateKey[] =
      period === 0 ? Array.from({ length: 7 }, (_, i) => addDays(weekStartOf(today), i)) : Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
    const stats = days.map((x) => ({ day: x, s: dayStats(x, state.meals, state.activity[x]), norm: normOn(state, x) }));
    const past = stats.filter((x) => x.day <= today);
    const fed = past.filter((x) => x.s.meals > 0);
    const avg = fed.length ? fed.reduce((n, x) => n + x.s.kcal, 0) / fed.length : 0;
    const stepDays = past.filter((x) => x.s.steps > 0);
    const steps = stepDays.length ? stepDays.reduce((n, x) => n + x.s.steps, 0) / stepDays.length : 0;
    const xp = past.reduce((n, x) => n + dayXp(state, x.day), 0);
    return { stats, avg, steps, xp, goal: normOn(state, today) };
  }, [d, period]);

  if (!d || !data) return null;
  const trend = smoothWeights(weights).at(-1)?.trend ?? d.weight;
  const W = width - 40;
  const H = 210;
  const max = Math.max(data.goal * 1.15, ...data.stats.map((x) => x.s.kcal), 1);
  const n = data.stats.length;
  const gap = period === 0 ? 14 : 3;
  const bw = (W - gap * (n - 1)) / n;
  const goalY = H - (data.goal / max) * H;

  const addWeight = () =>
    Alert.prompt?.('Вес', 'Сколько показали весы, кг?', (v) => {
      const kg = Number(String(v).replace(',', '.'));
      if (kg > 20 && kg < 400) useStore.getState().addWeight(kg);
    }, 'plain-text', '', 'decimal-pad');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: NAV_SPACE, gap: 20 }}>
        <Row style={{ justifyContent: 'space-between', height: 56, paddingHorizontal: 4 }}>
          <Txt size={32} weight="300">
            Прогресс
          </Txt>
          <Seg items={['НЕДЕЛЯ', 'МЕСЯЦ']} value={period} onChange={setPeriod} />
        </Row>

        <View style={{ paddingHorizontal: 4, gap: 4 }}>
          <Lbl>В среднем за день</Lbl>
          <Row gap={10} style={{ alignItems: 'flex-end' }}>
            <Num size={60}>{fmt(data.avg)}</Num>
            <Lbl style={{ marginBottom: 14 }}>ккал</Lbl>
          </Row>
        </View>

        <View>
          <Svg width={W} height={H + 4}>
            {data.stats.map((x, i) => {
              const h = Math.max(x.s.kcal > 0 ? 6 : 0, (x.s.kcal / max) * H);
              const isToday = x.day === d.today;
              return <Rect key={x.day} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={Math.min(14, bw / 2)} fill={isToday ? t.food : t.light ? '#FFFFFF' : t.food} opacity={isToday ? 1 : t.light ? 0.5 : 0.35} />;
            })}
            <Line x1={0} x2={W} y1={goalY} y2={goalY} stroke={t.mu} strokeDasharray="4 6" strokeWidth={1} />
          </Svg>
          <Lbl style={{ position: 'absolute', right: 0, top: Math.max(0, goalY - 22) }}>цель {fmt(data.goal)}</Lbl>
          {period === 0 && (
            <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
              {DOW.map((x) => (
                <Lbl key={x} style={{ width: bw, textAlign: 'center' }}>
                  {x}
                </Lbl>
              ))}
            </Row>
          )}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Tile color={t.steps} label="Шаги" value={fmt(data.steps)} unit="в день" />
          <Tile color={t.food} label="Серия" value={String(d.game.streak)} unit={plural(d.game.streak, 'день', 'дня', 'дней')} />
          <Tile color={t.tx} label="Вес" value={String(Math.round(trend * 10) / 10).replace('.', ',')} unit="кг" onPress={addWeight} />
          <Tile color={t.xp} label="Опыт" value={`+${fmt(data.xp)}`} unit="XP" />
        </View>
      </ScrollView>
      <BottomNav active="progress" />
    </Screen>
  );
}

function Tile({ color, label, value, unit, onPress }: { color: string; label: string; value: string; unit: string; onPress?: () => void }) {
  return (
    <Card onPress={onPress} style={{ width: '48%', flexGrow: 1, height: 92, padding: 16, justifyContent: 'space-between' }}>
      <Row gap={8}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        <Lbl>{label}</Lbl>
      </Row>
      <Num size={22} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        <Txt size={12} muted>
          {' '}
          {unit}
        </Txt>
      </Num>
    </Card>
  );
}

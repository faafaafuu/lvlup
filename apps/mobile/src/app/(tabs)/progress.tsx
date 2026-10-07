import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { addDays, dateKey, dayStats, smoothWeights } from '@levelup/domain';
import { Btn, Card, Chip, Row, SectionTitle, T, textInputStyle } from '@/components/ui';
import { fmt } from '@/lib/format';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useTheme } from '@/theme';

const PERIODS = [
  { label: 'Месяц', days: 30 },
  { label: '3 месяца', days: 90 },
  { label: 'Всё', days: 3650 },
];

export default function ProgressScreen() {
  const { c } = useTheme();
  const game = useGame();
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const addWeight = useStore((s) => s.addWeight);
  const patchActivity = useStore((s) => s.patchActivity);
  const healthOn = useStore((s) => s.settings.health);
  const [period, setPeriod] = useState(30);
  const [kg, setKg] = useState('');
  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState('');

  const today = dateKey(new Date());
  const series = useMemo(() => smoothWeights(weights).filter((w) => w.date >= addDays(today, -period)), [weights, period, today]);
  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => ({ d, s: dayStats(d, meals, activity[d]) })),
    [meals, activity, today],
  );

  if (!profile || !game) return null;
  const lost = Math.round((profile.startWeightKg - game.weight) * 10) / 10;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <SectionTitle right={<T tone="success" bold>{lost > 0 ? `−${lost} кг с начала` : `${game.weight} кг`}</T>}>Вес</SectionTitle>
        <Card style={{ gap: 12 }}>
          <Row>
            {PERIODS.map((p) => (
              <Chip key={p.days} label={p.label} active={period === p.days} onPress={() => setPeriod(p.days)} />
            ))}
          </Row>
          <WeightChart points={series} target={profile.targetWeightKg} />
          <T size="xs" tone="muted">
            Линия — сглаженный тренд, точки — реальные взвешивания. Скачки воды за день на тренд почти не влияют.
          </T>
          <Row>
            <TextInput value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="Вес, кг" placeholderTextColor={c.textMuted} style={[textInputStyle(c), { flex: 1 }]} />
            <Btn
              title="Добавить"
              disabled={!(Number(kg.replace(',', '.')) > 20)}
              onPress={() => {
                addWeight(Number(kg.replace(',', '.')));
                setKg('');
              }}
            />
          </Row>
        </Card>

        <SectionTitle>Калории за неделю</SectionTitle>
        <Card>
          <Bars values={week.map((w) => w.s.kcal)} labels={week.map((w) => w.d.slice(8))} line={game.norm} color={c.primary} />
          <T size="xs" tone="muted">
            Пунктир — твоя норма {fmt(game.norm)} ккал
          </T>
        </Card>

        <SectionTitle>Шаги за неделю</SectionTitle>
        <Card style={{ gap: 12 }}>
          <Bars values={week.map((w) => w.s.steps)} labels={week.map((w) => w.d.slice(8))} line={profile.stepsGoal} color={c.xp} />
          {!healthOn && (
            <View style={{ gap: 8 }}>
              <T size="sm" tone="muted">
                Здоровье не подключено — можно ввести за сегодня вручную:
              </T>
              <Row>
                <TextInput value={steps} onChangeText={setSteps} keyboardType="number-pad" placeholder="Шаги" placeholderTextColor={c.textMuted} style={[textInputStyle(c), { flex: 1 }]} />
                <TextInput value={sleep} onChangeText={setSleep} keyboardType="decimal-pad" placeholder="Сон, ч" placeholderTextColor={c.textMuted} style={[textInputStyle(c), { flex: 1 }]} />
                <Btn
                  title="OK"
                  disabled={!steps && !sleep}
                  onPress={() => {
                    const patch: { steps?: number; sleepHours?: number } = {};
                    if (steps) patch.steps = Number(steps);
                    if (sleep) patch.sleepHours = Number(sleep.replace(',', '.'));
                    patchActivity(today, patch);
                    setSteps('');
                    setSleep('');
                  }}
                />
              </Row>
              <Btn title="+ Тренировка сегодня (+50 XP)" kind="ghost" onPress={() => patchActivity(today, { workouts: (activity[today]?.workouts ?? 0) + 1 })} />
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeightChart({ points, target }: { points: Array<{ date: string; kg: number; trend: number }>; target: number }) {
  const { c } = useTheme();
  const W = 320;
  const H = 160;
  if (points.length < 2) {
    return (
      <T tone="muted" style={{ textAlign: 'center', paddingVertical: 24 }}>
        Нужно хотя бы два взвешивания, чтобы нарисовать тренд
      </T>
    );
  }
  const all = [...points.flatMap((p) => [p.kg, p.trend]), target];
  const min = Math.min(...all) - 0.5;
  const max = Math.max(...all) + 0.5;
  const x = (i: number) => 8 + (i / (points.length - 1)) * (W - 16);
  const y = (v: number) => 8 + (1 - (v - min) / (max - min)) * (H - 16);
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke={c.success} strokeDasharray="4 4" strokeWidth={1} />
      {points.map((p, i) => (
        <Circle key={p.date} cx={x(i)} cy={y(p.kg)} r={3} fill={c.textMuted} opacity={0.5} />
      ))}
      <Polyline points={points.map((p, i) => `${x(i)},${y(p.trend)}`).join(' ')} fill="none" stroke={c.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

function Bars({ values, labels, line, color }: { values: number[]; labels: string[]; line: number; color: string }) {
  const { c } = useTheme();
  const W = 320;
  const H = 120;
  const max = Math.max(line * 1.2, ...values, 1);
  const bw = W / values.length;
  const ly = H - (line / max) * H;
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {values.map((v, i) => {
          const h = (v / max) * H;
          return <Line key={i} x1={i * bw + bw / 2} x2={i * bw + bw / 2} y1={H} y2={H - h} stroke={color} strokeWidth={bw * 0.5} strokeLinecap="round" opacity={v > 0 ? 1 : 0} />;
        })}
        <Line x1={0} x2={W} y1={ly} y2={ly} stroke={c.textMuted} strokeDasharray="4 4" />
      </Svg>
      <Row style={{ justifyContent: 'space-around' }}>
        {labels.map((l) => (
          <T key={l} size="xs" tone="muted">
            {l}
          </T>
        ))}
      </Row>
    </View>
  );
}

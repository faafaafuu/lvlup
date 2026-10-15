import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { NAV_SPACE } from '@/components/BottomNav';
import { EntryRow } from '@/components/EntryRow';
import { usePager } from '@/components/Pager';
import { XP_PER_LEVEL, dateKey, mealDateKey } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { fmt, timeOf } from '@/lib/format';
import { useDay } from '@/state/useDay';
import { useStore } from '@/state/store';
import { Card, Lbl, Num, Pill, Rings, Row, Screen, Sep, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const DOW = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MON = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЯ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];

/** Главный экран из макета: три кольца (еда · шаги · опыт), остаток калорий и всё, что съедено сегодня. */
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
  // Сегодняшние продукты, свежие сверху: каждый — строка с карточкой и смахиванием.
  const eaten = meals
    .filter((m) => mealDateKey(m.at) === today)
    .sort((a, b) => b.at.localeCompare(a.at))
    .flatMap((m) => m.items.map((it, idx) => ({ m, it, idx })));
  const size = Math.min(320, width - 70);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: NAV_SPACE }} showsVerticalScrollIndicator={false}>
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

      <View style={{ paddingHorizontal: 20, marginTop: 28, gap: 8 }}>
        {eaten.length > 0 && (
          <Row style={{ justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Lbl>Сегодня · {eaten.length}</Lbl>
            <Lbl>смахни влево — изменить</Lbl>
          </Row>
        )}
        {eaten.length ? (
          <Card style={{ overflow: 'hidden' }}>
            {eaten.map(({ m, it, idx }, i) => (
              <View key={`${m.id}-${idx}`}>
                {i > 0 && <Sep />}
                <EntryRow
                  onOpen={() => router.push({ pathname: '/entry/[id]', params: { id: m.id } })}
                  onDelete={() => useStore.getState().deleteItem(m.id, idx)}
                >
                  <Row style={{ paddingHorizontal: 18, paddingVertical: 14 }} gap={14}>
                    <Lbl style={{ fontSize: 12, width: 40 }}>{timeOf(m.at)}</Lbl>
                    <Txt style={{ flex: 1 }} numberOfLines={1}>
                      {it.name}
                    </Txt>
                    <Num size={17}>
                      {fmt(it.nutrients.kcal)}
                      <Lbl> ккал</Lbl>
                    </Num>
                    <Icon name="chevronRight" size={16} color={t.mu} />
                  </Row>
                </EntryRow>
              </View>
            ))}
          </Card>
        ) : (
          <Card
            onPress={() => {
              setViewDate(today);
              pager.go(0);
            }}
            style={{ height: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Txt muted style={{ flex: 1 }}>
              Скажи, что съел — нажми на микрофон
            </Txt>
            <Icon name="chevronRight" size={18} color={t.mu} />
          </Card>
        )}
      </View>
      </ScrollView>
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

import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { MealLog, addDays, mealDateKey, mealSlot } from '@levelup/domain';
import { NAV_SPACE } from '@/components/BottomNav';
import { useCapture } from '@/components/CaptureHost';
import { EntryRow } from '@/components/EntryRow';
import { WeekStrip } from '@/components/WeekStrip';
import { Icon } from '@/design/Icon';
import { fmt, timeOf } from '@/lib/format';
import { syncHealth } from '@/lib/healthSync';
import { useDay } from '@/state/useDay';
import { useStore } from '@/state/store';
import { Card, Lbl, Num, Row, Screen, Sep, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

/** Строка записи: отступы внутри, чтобы кнопки смахивания были во всю высоту. */
const ROW = { justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 } as const;

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

/** Дневник из макета: неделя, итог дня, записи по приёмам пищи. Микрофон пишет в выбранный день. */
export function DiaryPage() {
  const t = useTheme();
  const d = useDay();
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const pending = useStore((s) => s.pending);
  const health = useStore((s) => s.settings.health);
  const setDay = useStore((s) => s.setViewDate);
  const capture = useCapture();

  useEffect(() => {
    if (d && health && d.day !== d.today) void syncHealth(1, d.day);
  }, [d?.day, health]);

  if (!d) return null;
  const { day, today } = d;
  const dayMeals = meals.filter((m) => mealDateKey(m.at) === day).sort((a, b) => a.at.localeCompare(b.at));
  const sessions = activity[day]?.sessions ?? [];
  const groups: Array<{ slot: string; time: string; meals: MealLog[] }> = [];
  for (const m of dayMeals) {
    const slot = mealSlot(m.at);
    const g = groups[groups.length - 1];
    if (g && g.slot === slot) g.meals.push(m);
    else groups.push({ slot, time: timeOf(m.at), meals: [m] });
  }
  const has = (x: string) => meals.some((m) => mealDateKey(m.at) === x) || !!activity[x]?.sessions?.length;
  const month = Number(day.slice(5, 7)) - 1;

  const open = (id: string, sessionDay?: string) => {
    router.push({ pathname: '/entry/[id]', params: sessionDay ? { id, day: sessionDay } : { id } });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: NAV_SPACE, gap: 18 }}>
        <Row style={{ justifyContent: 'space-between', height: 56, paddingHorizontal: 4 }}>
          <Txt size={32} weight="300">
            Дневник
          </Txt>
          <Row gap={14}>
            <Pressable accessibilityLabel="Прошлая неделя" hitSlop={10} onPress={() => setDay(addDays(day, -7))}>
              <Icon name="chevronLeft" size={18} color={t.mu} />
            </Pressable>
            <Pressable onPress={() => setDay(today)} accessibilityLabel="Сегодня">
              <Lbl style={{ fontSize: 12 }}>{MONTHS[month]}</Lbl>
            </Pressable>
            <Pressable accessibilityLabel="Следующая неделя" hitSlop={10} disabled={addDays(day, 7) > today && day === today} onPress={() => setDay(addDays(day, 7))}>
              <Icon name="chevronRight" size={18} color={t.mu} />
            </Pressable>
          </Row>
        </Row>

        <WeekStrip selected={day} today={today} hasEntries={has} onSelect={setDay} />

        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 6 }}>
          <Lbl>Итого</Lbl>
          <Num size={20}>
            {fmt(d.stats.kcal)}
            <Lbl> / {fmt(d.norm)} ккал</Lbl>
          </Num>
        </Row>

        {groups.length === 0 && sessions.length === 0 && (
          <Txt muted style={{ textAlign: 'center', marginTop: 24 }}>
            {day === today ? 'Пока пусто. Нажми на микрофон и скажи, что ел.' : 'В этот день записей нет. Микрофон запишет сюда.'}
          </Txt>
        )}

        {groups.map((g) => (
          <View key={g.slot + g.time} style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between', paddingHorizontal: 4 }}>
              <Lbl>{g.slot}</Lbl>
              <Lbl>{g.time}</Lbl>
            </Row>
            <Card style={{ overflow: 'hidden' }}>
              {g.meals.flatMap((m) =>
                m.items.map((it, idx) => ({ m, it, idx, key: `${m.id}-${idx}` })),
              ).map(({ m, it, idx, key }, i) => (
                <View key={key}>
                  {i > 0 && <Sep />}
                  <EntryRow onOpen={() => open(m.id)} onDelete={() => useStore.getState().deleteItem(m.id, idx)}>
                    <Row style={ROW}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt>{it.name}</Txt>
                        <Txt size={14} muted>
                          {it.unit === 'g' || it.unit === 'ml' ? `${it.grams} ${it.unit === 'ml' ? 'мл' : 'г'}` : `${String(it.quantity).replace('.', ',')} ${unitWord(it.unit)}`}
                        </Txt>
                      </View>
                      <Num size={18}>{fmt(it.nutrients.kcal)}</Num>
                      <Icon name="chevronRight" size={16} color={t.mu} />
                    </Row>
                  </EntryRow>
                </View>
              ))}
            </Card>
          </View>
        ))}

        {sessions.length > 0 && (
          <View style={{ gap: 8 }}>
            <Lbl style={{ paddingHorizontal: 4 }}>Тренировки</Lbl>
            <Card style={{ overflow: 'hidden' }}>
              {sessions.map((a, i) => (
                <View key={a.id}>
                  {i > 0 && <Sep />}
                  <EntryRow onOpen={() => open(a.id, day)} onDelete={() => useStore.getState().deleteSession(day, a.id)}>
                    <Row style={ROW}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt>{a.name}</Txt>
                        <Txt size={14} muted>
                          {timeOf(a.at)} · {a.minutes} мин{a.text === 'Здоровье' ? ' · из Здоровья' : ''}
                        </Txt>
                      </View>
                      <Num size={18} color={t.steps}>
                        −{fmt(a.kcal)}
                      </Num>
                      <Icon name="chevronRight" size={16} color={t.mu} />
                    </Row>
                  </EntryRow>
                </View>
              ))}
            </Card>
          </View>
        )}

        {day === today && pending.length > 0 && (
          <View style={{ gap: 8 }}>
            <Lbl style={{ paddingHorizontal: 4 }}>Ждут интернета</Lbl>
            <Card style={{ paddingHorizontal: 18 }}>
              {pending.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Sep />}
                  <Row style={{ paddingVertical: 14, justifyContent: 'space-between' }}>
                    <Txt style={{ flex: 1 }} numberOfLines={1}>
                      «{p.text}»
                    </Txt>
                    <Pressable hitSlop={8} onPress={() => void capture.parsePending(p.text, p.id)}>
                      <Lbl color={t.tx}>разобрать</Lbl>
                    </Pressable>
                  </Row>
                </View>
              ))}
            </Card>
          </View>
        )}
        {(groups.length > 0 || sessions.length > 0) && (
          <Txt size={13} muted style={{ textAlign: 'center' }}>
            Нажми на запись — карточка; смахни влево — изменить или удалить
          </Txt>
        )}
      </ScrollView>
    </Screen>
  );
}

const UNIT_WORD: Record<string, string> = {
  piece: 'шт', plate: 'тарелка', bowl: 'миска', serving: 'порция', slice: 'кусок', glass: 'стакан', cup: 'кружка',
  tbsp: 'ст. ложка', tsp: 'ч. ложка', handful: 'горсть', pack: 'пачка', bottle: 'бутылка', can: 'банка', bar: 'плитка', square: 'квадратик',
};
function unitWord(u: string) {
  return UNIT_WORD[u] ?? u;
}

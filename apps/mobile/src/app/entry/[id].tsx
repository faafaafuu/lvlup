import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MealDraft, MealLog, dateKey, mealDateKey, mealSlot, stepItem } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { fmt, humanDate, timeOf } from '@/lib/format';
import { success, tap } from '@/lib/haptics';
import { useStore } from '@/state/store';
import { Card, Circ, Ghost, Lbl, Num, Row, Screen, Sep, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

type Item = MealLog['items'][number];

const UNIT_WORD: Record<string, string> = {
  piece: 'шт', plate: 'тарелка', bowl: 'миска', serving: 'порция', slice: 'кусок', glass: 'стакан', cup: 'кружка',
  tbsp: 'ст. ложка', tsp: 'ч. ложка', handful: 'горсть', pack: 'пачка', bottle: 'бутылка', can: 'банка', bar: 'плитка', square: 'квадратик',
};
const byWeight = (it: Item) => it.unit === 'g' || it.unit === 'ml';
const amountOf = (it: Item) =>
  byWeight(it) ? `${Math.round(it.grams)} ${it.unit === 'ml' ? 'мл' : 'г'}` : `${String(it.quantity).replace('.', ',')} ${UNIT_WORD[it.unit] ?? it.unit}`;

/** Карточка записи из дневника: что сказал, продукты с порцией ±, повторить, удалить (с «Вернуть»). */
export default function Entry() {
  const t = useTheme();
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  const meal = useStore((s) => s.meals.find((m) => m.id === id));
  const session = useStore((s) => (day ? s.activity[day]?.sessions?.find((x) => x.id === id) : undefined));

  const header = (title: string, sub: string) => (
    <Row style={{ justifyContent: 'space-between', height: 56, paddingHorizontal: 4 }}>
      <Circ icon="chevronLeft" label="Назад" onPress={() => router.back()} />
      <View style={{ alignItems: 'flex-end' }}>
        <Lbl color={t.tx}>{title}</Lbl>
        <Lbl>{sub}</Lbl>
      </View>
    </Row>
  );

  if (session && day) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 18 }}>
          {header('Тренировка', `${humanDate(day, dateKey(new Date()))} · ${timeOf(session.at)}`)}
          <View style={{ paddingHorizontal: 4, gap: 6 }}>
            <Txt size={28} weight="300">
              {session.name}
            </Txt>
            <Row gap={10} style={{ alignItems: 'flex-end' }}>
              <Num size={64} color={t.steps}>
                −{fmt(session.kcal)}
              </Num>
              <Lbl style={{ marginBottom: 14 }}>ккал · {session.minutes} мин</Lbl>
            </Row>
            {session.text === 'Здоровье' && <Txt muted>Из Apple Здоровье</Txt>}
          </View>
          <DeleteButton
            onPress={() => {
              useStore.getState().deleteSession(day, session.id);
              router.back();
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  if (!meal) {
    return (
      <Screen>
        <View style={{ paddingHorizontal: 20 }}>{header('Запись', '')}</View>
        <Txt muted style={{ textAlign: 'center', marginTop: 40 }}>
          Запись удалена
        </Txt>
      </Screen>
    );
  }

  const setItem = (i: number, next: Item | null) => {
    tap();
    const items = next ? meal.items.map((it, j) => (j === i ? next : it)) : meal.items.filter((_, j) => j !== i);
    useStore.getState().updateMeal(meal.id, items);
    if (!items.length) router.back();
  };
  const dayKey = mealDateKey(meal.at);
  const macros: Array<[string, number, string]> = [
    ['Белки', meal.totals.protein, t.protein],
    ['Жиры', meal.totals.fat, t.fat],
    ['Углеводы', meal.totals.carbs, t.carbs],
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 18 }}>
        {header(mealSlot(meal.at), `${humanDate(dayKey, dateKey(new Date()))} · ${timeOf(meal.at)}`)}

        <View style={{ paddingHorizontal: 4, gap: 4 }}>
          <Row gap={10} style={{ alignItems: 'flex-end' }}>
            <Num size={72}>{fmt(meal.totals.kcal)}</Num>
            <Lbl style={{ marginBottom: 16 }}>ккал</Lbl>
          </Row>
          <Row gap={18}>
            {macros.map(([label, value, color]) => (
              <Row key={label} gap={6}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                <Lbl>
                  {label} <Lbl color={t.tx}>{String(Math.round(value)).replace('.', ',')} г</Lbl>
                </Lbl>
              </Row>
            ))}
          </Row>
        </View>

        {!!meal.text && (
          <Txt muted style={{ paddingHorizontal: 4, fontStyle: 'italic' }}>
            «{meal.text}»
          </Txt>
        )}

        <Card style={{ paddingHorizontal: 16 }}>
          {meal.items.map((it, i) => (
            <View key={`${it.foodId}-${i}`}>
              {i > 0 && <Sep />}
              <Row style={{ paddingVertical: 12 }} gap={10}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt numberOfLines={2}>{it.name}</Txt>
                  <Txt size={14} muted>
                    {amountOf(it)} · {fmt(it.nutrients.kcal)} ккал
                  </Txt>
                </View>
                <Circ icon="minus" label={`Меньше: ${it.name}`} size={36} onPress={() => setItem(i, stepItem(it, -1))} />
                <Circ icon="plus" label={`Больше: ${it.name}`} size={36} onPress={() => setItem(i, stepItem(it, 1))} />
                <Pressable accessibilityLabel={`Убрать: ${it.name}`} hitSlop={8} onPress={() => setItem(i, null)} style={{ padding: 4 }}>
                  <Icon name="close" size={18} color={t.mu} />
                </Pressable>
              </Row>
            </View>
          ))}
        </Card>
        <Txt size={13} muted style={{ textAlign: 'center' }}>
          Меняется сразу — без сохранения
        </Txt>

        <Ghost
          title="Съел ещё раз — записать сейчас"
          onPress={() => {
            success();
            const again: MealDraft = { sourceText: meal.text, items: meal.items, totals: meal.totals, questions: [], unknown: [], activities: [] };
            useStore.getState().addEntry(again);
            router.back();
          }}
        />
        <DeleteButton
          onPress={() => {
            useStore.getState().deleteMeal(meal.id);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

function DeleteButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name="trash" size={18} color={t.xp} />
      <Txt color={t.xp}>Удалить запись</Txt>
    </Pressable>
  );
}

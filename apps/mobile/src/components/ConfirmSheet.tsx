import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ENTRY_XP_CAP, MealDraft, WORKOUT_XP_CAP, XP_PER_ENTRY, XP_PER_WORKOUT, answerQuestion, currentWeight, dateKey, describePortion, massUnit,
  mealDateKey, mealSlot, normOn, removeItem, setActivityMinutes, setItemGrams,
} from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { fmt, humanDate } from '@/lib/format';
import { atFor } from '@/state/useMealCapture';
import { useStore } from '@/state/store';
import { Bar, Card, Circ, Cta, Ghost, Lbl, Num, Row, Sep, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

interface Props {
  draft: MealDraft | null;
  source?: 'server' | 'offline';
  onChange: (draft: MealDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** «Проверка записи» из макета: главное блюдо крупно, остальное карточками, порция одним степпером. */
export function ConfirmSheet({ draft, source, onChange, onConfirm, onCancel }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [edit, setEdit] = useState(false);
  const [mult, setMult] = useState(1);
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const viewDate = useStore((s) => s.viewDate);

  useEffect(() => {
    setEdit(false);
    setMult(1);
  }, [draft?.sourceText]);

  if (!draft) return null;
  const kg = profile ? currentWeight(profile, weights) : 75;
  const activities = draft.activities ?? [];
  const items = draft.items;
  const main = [...items].sort((a, b) => b.nutrients.kcal - a.nutrients.kcal)[0];
  const rest = items.filter((i) => i !== main);
  const totals = draft.totals;
  const burned = activities.reduce((n, a) => n + a.kcal, 0);
  const nothing = items.length === 0 && activities.length === 0;
  const at = atFor(viewDate);
  const today = dateKey(new Date());
  const header = `${items.length ? mealSlot(at) : 'Тренировка'} · ${viewDate === today ? new Date(at).toTimeString().slice(0, 5) : humanDate(viewDate, today)}`;

  // Опыт, который реально начислится с учётом дневных лимитов.
  const mealsThatDay = meals.filter((m) => mealDateKey(m.at) === viewDate).length;
  const sessionsThatDay = activity[viewDate]?.sessions?.length ?? 0;
  const xp =
    (items.length && mealsThatDay < ENTRY_XP_CAP ? XP_PER_ENTRY : 0) +
    Math.max(0, Math.min(activities.length, WORKOUT_XP_CAP - sessionsThatDay)) * XP_PER_WORKOUT;

  const norm = profile ? normOn({ profile, weights }, viewDate) : 2000;
  const macroTarget = { protein: (norm * 0.25) / 4, fat: (norm * 0.3) / 9, carbs: (norm * 0.45) / 4 };

  const scale = (next: number) => {
    if (next < 0.5) return;
    const f = next / mult;
    let d = draft;
    d.items.forEach((it, i) => {
      d = setItemGrams(d, i, it.grams * f);
    });
    setMult(next);
    onChange(d);
  };
  const idx = (it: typeof items[number]) => items.indexOf(it);

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel} presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <Row style={{ paddingHorizontal: 24, justifyContent: 'space-between', height: 52 }}>
          <Circ icon="close" label="Закрыть" onPress={onCancel} />
          <Lbl>{header}</Lbl>
          <View style={{ width: 44 }} />
        </Row>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140, gap: 18 }}>
          {main ? (
            <View style={{ gap: 4 }}>
              <Txt size={28} weight="300">
                {main.name}
              </Txt>
              <Txt size={15} muted>
                {describePortion(main)}
                {main.assumed ? ' · на глаз' : ''}
                {source === 'offline' ? ' · офлайн' : ''}
              </Txt>
            </View>
          ) : activities[0] ? (
            <Txt size={28} weight="300">
              {activities[0].name}
            </Txt>
          ) : (
            <Txt size={20} weight="300" muted>
              Не понял, что записать. Попробуй проще: «тарелка борща» или «бегал полчаса».
            </Txt>
          )}

          {!nothing && (
            <Row gap={10} style={{ alignItems: 'flex-end' }}>
              <Num size={(items.length ? totals.kcal : burned) >= 1000 ? 68 : 88}>{fmt(items.length ? totals.kcal : burned)}</Num>
              <Lbl style={{ marginBottom: 16 }}>{items.length ? 'ккал' : 'ккал сожжено'}</Lbl>
            </Row>
          )}

          {items.length > 0 && (
            <Row gap={20}>
              {([
                ['Белки', totals.protein, macroTarget.protein, t.protein],
                ['Жиры', totals.fat, macroTarget.fat, t.fat],
                ['Углеводы', totals.carbs, macroTarget.carbs, t.carbs],
              ] as const).map(([label, value, target, color]) => (
                <View key={label} style={{ flex: 1, gap: 6 }}>
                  <Lbl>{label}</Lbl>
                  <Num size={18}>
                    {Math.round(value)}
                    <Txt size={12} muted>
                      {' '}г
                    </Txt>
                  </Num>
                  <Bar value={value / target} color={color} />
                </View>
              ))}
            </Row>
          )}

          {draft.questions.map((q) => (
            <Card key={q.id} style={{ padding: 16, gap: 10 }}>
              <Txt size={16}>{q.text}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {q.options.map((o, i) => (
                  <Pressable
                    key={o.label}
                    onPress={() => onChange(answerQuestion(draft, q.id, i))}
                    style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: i === q.defaultIndex ? t.cta : t.sf2 }}
                  >
                    <Txt size={14} color={i === q.defaultIndex ? t.onCta : t.tx}>
                      {o.label} · {o.kcal}
                    </Txt>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}

          {items.length > 0 && !edit && (
            <Card style={{ paddingHorizontal: 16, height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt>Порция</Txt>
              <Row gap={14}>
                <Circ icon="minus" label="Меньше" onPress={() => scale(mult - 0.5)} />
                <Num size={17} style={{ minWidth: 28, textAlign: 'center' }}>
                  {String(mult).replace('.', ',')}
                </Num>
                <Circ icon="plus" label="Больше" onPress={() => scale(mult + 0.5)} />
              </Row>
            </Card>
          )}

          {(edit ? items : rest).map((it) => (
            <Card key={`${it.foodId}-${idx(it)}`} style={{ padding: 16, gap: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Txt>{it.name}</Txt>
                  <Txt size={14} muted>
                    {describePortion(it)}
                  </Txt>
                </View>
                <Num size={17}>
                  {it.nutrients.kcal}
                  <Txt size={11} muted>
                    {' '}ККАЛ
                  </Txt>
                </Num>
              </Row>
              {edit && (
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={14}>
                    <Circ icon="minus" label="Меньше" onPress={() => onChange(setItemGrams(draft, idx(it), Math.max(5, it.grams - (it.grams > 100 ? 25 : 10))))} />
                    <Num size={15} style={{ minWidth: 64, textAlign: 'center' }}>
                      {it.grams} {massUnit(it)}
                    </Num>
                    <Circ icon="plus" label="Больше" onPress={() => onChange(setItemGrams(draft, idx(it), it.grams + (it.grams >= 100 ? 25 : 10)))} />
                  </Row>
                  <Pressable accessibilityLabel={`Убрать ${it.name}`} hitSlop={10} onPress={() => onChange(removeItem(draft, idx(it)))}>
                    <Icon name="trash" size={20} color={t.mu} />
                  </Pressable>
                </Row>
              )}
            </Card>
          ))}

          {activities.map((a, i) => (
            <Card key={`act-${i}`} style={{ padding: 16, gap: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Txt>{a.name}</Txt>
                  <Txt size={14} muted>
                    {[`${a.minutes} мин`, a.reps ? `${a.reps} повт.` : '', a.weightKg ? `снаряд ${a.weightKg} кг` : ''].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
                <Num size={17} color={t.steps}>
                  −{a.kcal}
                </Num>
              </Row>
              {edit && (
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row gap={14}>
                    <Circ icon="minus" label="Меньше" onPress={() => onChange({ ...draft, activities: activities.map((x, j) => (j === i ? setActivityMinutes(x, Math.max(5, x.minutes - 5), kg) : x)) })} />
                    <Num size={15} style={{ minWidth: 64, textAlign: 'center' }}>
                      {a.minutes} мин
                    </Num>
                    <Circ icon="plus" label="Больше" onPress={() => onChange({ ...draft, activities: activities.map((x, j) => (j === i ? setActivityMinutes(x, x.minutes + 5, kg) : x)) })} />
                  </Row>
                  <Pressable accessibilityLabel={`Убрать ${a.name}`} hitSlop={10} onPress={() => onChange({ ...draft, activities: activities.filter((_, j) => j !== i) })}>
                    <Icon name="trash" size={20} color={t.mu} />
                  </Pressable>
                </Row>
              )}
            </Card>
          ))}

          {draft.unknown.map((u) => (
            <Txt key={u} size={14} muted>
              Не знаю, что такое «{u}» — пропущу.
            </Txt>
          ))}
          {draft.sourceText ? (
            <>
              <Sep />
              <Txt size={13} muted>
                Ты сказал: «{draft.sourceText}»
              </Txt>
            </>
          ) : null}
        </ScrollView>

        <Svg pointerEvents="none" width={width} height={Math.max(insets.bottom, 16) + 120} style={{ position: 'absolute', left: 0, bottom: 0 }}>
          <Defs>
            <LinearGradient id="cfade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.bg} stopOpacity={0} />
              <Stop offset="0.4" stopColor={t.bg} stopOpacity={0.95} />
              <Stop offset="1" stopColor={t.bg} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={Math.max(insets.bottom, 16) + 120} fill="url(#cfade)" />
        </Svg>
        <Row style={{ position: 'absolute', left: 24, right: 24, bottom: Math.max(insets.bottom, 16) + 8 }}>
          <Ghost title={edit ? 'Готово' : 'Изменить'} onPress={() => setEdit(!edit)} disabled={nothing} />
          <Cta title="Добавить" extra={xp ? `+${xp} XP` : undefined} style={{ flex: 1 }} disabled={nothing} onPress={onConfirm} />
        </Row>
      </View>
    </Modal>
  );
}

import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, dateKey, describePortion, mealDateKey, sumNutrients } from '@levelup/domain';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { Btn, Card, Row, SectionTitle, T } from '@/components/ui';
import { Icon } from '@/design/Icon';
import { fmt, humanDate, timeOf } from '@/lib/format';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useMealCapture } from '@/state/useMealCapture';
import { useTheme } from '@/theme';

const NO_SESSIONS: never[] = [];

export default function DiaryScreen() {
  const { c } = useTheme();
  const today = dateKey(new Date());
  const [day, setDay] = useState(today);
  const meals = useStore((s) => s.meals);
  const pending = useStore((s) => s.pending);
  const deleteMeal = useStore((s) => s.deleteMeal);
  const deleteSession = useStore((s) => s.deleteSession);
  // Селектор zustand должен возвращать стабильную ссылку: `?? []` внутри создавал бы
  // новый массив на каждый рендер → бесконечный перерендер и вылет в дни без тренировок.
  const sessions = useStore((s) => s.activity[day]?.sessions) ?? NO_SESSIONS;
  const removePending = useStore((s) => s.removePending);
  const game = useGame();
  const capture = useMealCapture();
  const [busy, setBusy] = useState<string | null>(null);

  const dayMeals = meals.filter((m) => mealDateKey(m.at) === day).sort((a, b) => a.at.localeCompare(b.at));
  const totals = sumNutrients(dayMeals.map((m) => ({ nutrients: m.totals })));

  const askDelete = (id: string, title: string) =>
    Alert.alert('Удалить запись?', title, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteMeal(id) },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable accessibilityLabel="Предыдущий день" hitSlop={12} onPress={() => setDay(addDays(day, -1))}>
            <Icon name="chevronLeft" color={c.text} />
          </Pressable>
          <Pressable onPress={() => setDay(today)}>
            <T size="lg" bold>
              {humanDate(day, today)}
            </T>
          </Pressable>
          <Pressable accessibilityLabel="Следующий день" hitSlop={12} disabled={day >= today} onPress={() => setDay(addDays(day, 1))}>
            <View style={{ opacity: day >= today ? 0.2 : 1 }}>
              <Icon name="chevronRight" color={c.text} />
            </View>
          </Pressable>
        </Row>

        <Card>
          <T size="lg" bold display>
            {fmt(totals.kcal)} ккал{game ? <T tone="muted"> из {fmt(game.norm)}</T> : null}
          </T>
          <T tone="muted" size="sm">
            Белки {Math.round(totals.protein)} г · Жиры {Math.round(totals.fat)} г · Углеводы {Math.round(totals.carbs)} г
          </T>
        </Card>

        {pending.length > 0 && day === today && (
          <View style={{ gap: 8 }}>
            <SectionTitle>Ждут интернета</SectionTitle>
            {pending.map((p) => (
              <Card key={p.id} style={{ gap: 8 }}>
                <T>«{p.text}»</T>
                <Row>
                  <Btn
                    title="Разобрать"
                    loading={busy === p.id}
                    style={{ flex: 1 }}
                    onPress={async () => {
                      setBusy(p.id);
                      await capture.parse(p.text, p.id);
                      setBusy(null);
                    }}
                  />
                  <Btn title="Удалить" kind="ghost" onPress={() => removePending(p.id)} />
                </Row>
              </Card>
            ))}
          </View>
        )}

        {sessions.map((a) => (
          <Card key={a.id} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={8} style={{ flex: 1 }}>
                <Icon name="workout" size={18} color={c.primary} />
                <T bold style={{ flex: 1 }}>
                  {a.name}
                </T>
              </Row>
              <Row gap={12}>
                <T bold tone="streak">
                  −{a.kcal} ккал
                </T>
                <Pressable accessibilityLabel="Удалить тренировку" hitSlop={10} onPress={() => deleteSession(day, a.id)}>
                  <Icon name="trash" size={18} color={c.textMuted} />
                </Pressable>
              </Row>
            </Row>
            <T size="sm" tone="muted">
              {timeOf(a.at)} · {a.minutes} мин{a.reps ? ` · ${a.reps} повт.` : ''}
              {a.weightKg ? ` · снаряд ${a.weightKg} кг` : ''}
            </T>
          </Card>
        ))}

        {dayMeals.length === 0 && sessions.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
            <Icon name="plate" size={40} color={c.textMuted} />
            <T tone="muted" style={{ textAlign: 'center' }}>
              Пока пусто. Нажми на микрофон на главном экране и скажи, что ел.
            </T>
          </Card>
        ) : (
          dayMeals.map((m) => (
            <Pressable key={m.id} onLongPress={() => askDelete(m.id, m.text)}>
              <Card style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T tone="muted" size="sm">
                    {timeOf(m.at)}
                  </T>
                  <Row gap={12}>
                    <T bold>{fmt(m.totals.kcal)} ккал</T>
                    <Pressable accessibilityLabel="Удалить запись" hitSlop={10} onPress={() => askDelete(m.id, m.text)}>
                      <Icon name="trash" size={18} color={c.textMuted} />
                    </Pressable>
                  </Row>
                </Row>
                {m.items.map((i, idx) => (
                  <T key={idx} size="sm">
                    {i.name} <T size="sm" tone="muted">· {describePortion(i)} · {i.nutrients.kcal} ккал</T>
                  </T>
                ))}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
      <ConfirmSheet draft={capture.draft} source={capture.source} onChange={capture.setDraft} onConfirm={capture.confirm} onCancel={capture.cancel} />
    </SafeAreaView>
  );
}

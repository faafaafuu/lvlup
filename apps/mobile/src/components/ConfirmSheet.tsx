import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MealDraft, XP, answerQuestion, describePortion, removeItem, setItemGrams } from '@levelup/domain';
import { useTheme } from '@/theme';
import { fmt } from '@/lib/format';
import { Btn, Chip, Row, Stepper, T } from './ui';

interface Props {
  draft: MealDraft | null;
  source?: 'server' | 'offline';
  onChange: (draft: MealDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Подтверждение записи: позиции, уточняющие вопросы, итог. Цель — один тап «Записать». */
export function ConfirmSheet({ draft, source, onChange, onConfirm, onCancel }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!draft) return null;
  const t = draft.totals;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={onCancel} accessibilityLabel="Закрыть" />
      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: insets.bottom + 12 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, marginTop: 8 }} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <View>
            <T size="xl" bold>
              Записываю
            </T>
            <T tone="muted" numberOfLines={2}>
              «{draft.sourceText}»{source === 'offline' ? ' · офлайн-разбор' : ''}
            </T>
          </View>

          {draft.questions.map((q) => (
            <View key={q.id} style={{ gap: 8, padding: 14, borderRadius: 16, backgroundColor: c.surfaceAlt }}>
              <T bold>{q.text}</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {q.options.map((o, i) => (
                  <Chip key={o.label} label={`${o.label} · ${o.kcal}`} active={i === q.defaultIndex} onPress={() => onChange(answerQuestion(draft, q.id, i))} />
                ))}
              </View>
            </View>
          ))}

          {draft.items.map((item, i) => (
            <Row key={`${item.foodId}-${i}`} style={{ justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.border }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T bold>
                  {item.assumed ? '≈ ' : ''}
                  {item.name}
                </T>
                <T size="sm" tone="muted">
                  {describePortion(item)} · {item.nutrients.kcal} ккал
                </T>
              </View>
              <Stepper value={item.grams} step={item.grams >= 100 ? 25 : 10} min={5} suffix=" г" onChange={(g) => onChange(setItemGrams(draft, i, g))} />
              <Pressable accessibilityLabel={`Убрать ${item.name}`} hitSlop={10} onPress={() => onChange(removeItem(draft, i))} style={{ marginLeft: 8 }}>
                <T tone="muted">✕</T>
              </Pressable>
            </Row>
          ))}

          {draft.unknown.map((u) => (
            <T key={u} tone="muted" size="sm">
              Не знаю, что такое «{u}» — пропущу. Можно сказать иначе или выбрать похожее блюдо.
            </T>
          ))}

          {draft.items.length === 0 ? (
            <T tone="muted">Не нашёл еды во фразе. Попробуй сказать проще: «тарелка борща и хлеб».</T>
          ) : (
            <Row style={{ justifyContent: 'space-between' }}>
              <T size="lg" bold>
                ~{fmt(t.kcal)} ккал
              </T>
              <T size="sm" tone="muted">
                Б {Math.round(t.protein)} · Ж {Math.round(t.fat)} · У {Math.round(t.carbs)}
              </T>
            </Row>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          <Btn title={`Записать · +${XP.meal} XP`} onPress={onConfirm} disabled={draft.items.length === 0} />
          <Btn title="Отмена" kind="ghost" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MealDraft, XP, answerQuestion, describePortion, removeItem, setItemGrams } from '@levelup/domain';
import { ConfirmItem } from '@/design/components';
import { Icon } from '@/design/Icon';
import { useTheme } from '@/theme';
import { fmt } from '@/lib/format';
import { Btn, Chip, Row, T } from './ui';

interface Props {
  draft: MealDraft | null;
  source?: 'server' | 'offline';
  onChange: (draft: MealDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Подтверждение записи: позиции, уточняющие вопросы, итог. Цель — один тап «Записать». */
export function ConfirmSheet({ draft, source, onChange, onConfirm, onCancel }: Props) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  if (!draft) return null;
  const totals = draft.totals;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={onCancel} accessibilityLabel="Закрыть" />
      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: insets.bottom + 12 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, marginTop: 8 }} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <View>
            <T size="xl" bold display>
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

          {draft.items.map((item, i) => {
            const step = item.grams >= 100 ? 25 : 10;
            return (
              <Row key={`${item.foodId}-${i}`} gap={6}>
                <View style={{ flex: 1 }}>
                  <ConfirmItem
                    t={t}
                    name={item.name}
                    portion={describePortion(item)}
                    grams={item.grams}
                    unit={item.unit === 'ml' ? 'мл' : 'г'}
                    kcal={item.nutrients.kcal}
                    approx={item.assumed}
                    onMinus={() => onChange(setItemGrams(draft, i, Math.max(5, item.grams - step)))}
                    onPlus={() => onChange(setItemGrams(draft, i, item.grams + step))}
                  />
                </View>
                <Pressable accessibilityLabel={`Убрать ${item.name}`} hitSlop={8} onPress={() => onChange(removeItem(draft, i))} style={{ padding: 8 }}>
                  <Icon name="trash" size={20} color={c.textMuted} />
                </Pressable>
              </Row>
            );
          })}

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
                ~{fmt(totals.kcal)} ккал
              </T>
              <T size="sm" tone="muted">
                Б {Math.round(totals.protein)} · Ж {Math.round(totals.fat)} · У {Math.round(totals.carbs)}
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

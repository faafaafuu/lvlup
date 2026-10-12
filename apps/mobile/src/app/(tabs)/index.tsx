import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dateKey, dayStats, evaluateDay, mealDateKey, normOn, rateOn } from '@levelup/domain';
import { useCapture } from '@/components/CaptureHost';
import { Row, T } from '@/components/ui';
import { WeekStrip } from '@/components/WeekStrip';
import { Ring } from '@/design/components';
import { Icon } from '@/design/Icon';
import { fmt, humanDate, timeOf } from '@/lib/format';
import { syncHealth } from '@/lib/healthSync';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

/** Над плавающим таб-баром остаётся место, чтобы последний блок не прятался под стекло. */
export const TAB_BAR_SPACE = 120;

const CHECK_LABEL = { logged: 'Еда', plan: 'План', moved: 'Движение' } as const;

/**
 * Один экран на день: календарь недели → одно кольцо калорий → три отметки → записи.
 * Выбранный день — общий для микрофона: можно дописать вчерашний ужин.
 */
export default function DayScreen() {
  const t = useTheme();
  const { c } = t;
  const profile = useStore((s) => s.profile);
  const meals = useStore((s) => s.meals);
  const activity = useStore((s) => s.activity);
  const weights = useStore((s) => s.weights);
  const motivation = useStore((s) => s.motivation);
  const pending = useStore((s) => s.pending);
  const health = useStore((s) => s.settings.health);
  const day = useStore((s) => s.viewDate);
  const setDay = useStore((s) => s.setViewDate);
  const capture = useCapture();
  const today = dateKey(new Date());

  // Открыли прошлый день — подтянем его из Здоровья (шаги, сон, тренировки).
  useEffect(() => {
    if (health && day !== today) void syncHealth(1, day);
  }, [day, health, today]);

  if (!profile) return null;
  const state = { profile, meals, activity, weights };
  const stats = dayStats(day, meals, activity[day]);
  const norm = normOn(state, day);
  const result = evaluateDay(state, day, motivation.rates, day < today);
  const rate = rateOn(motivation.rates, day);
  const reward = result.score === 3 ? rate : result.good ? Math.round(rate / 2) : 0;
  const over = stats.kcal > norm;
  const dayMeals = meals.filter((m) => mealDateKey(m.at) === day).sort((a, b) => a.at.localeCompare(b.at));
  const sessions = activity[day]?.sessions ?? [];
  const deleteMeal = useStore.getState().deleteMeal;
  const deleteSession = useStore.getState().deleteSession;

  const askDelete = (title: string, run: () => void) =>
    Alert.alert('Удалить запись?', title, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: run },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: TAB_BAR_SPACE, gap: 20 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={() => setDay(today)} accessibilityLabel="Вернуться к сегодня">
            <T size="xl" bold display>
              {humanDate(day, today)}
            </T>
          </Pressable>
          <Row gap={20}>
            <Pressable accessibilityLabel="Записать текстом" hitSlop={12} onPress={capture.openText}>
              <Icon name="keyboard" size={24} color={c.textMuted} />
            </Pressable>
            <Pressable accessibilityLabel="Настройки" hitSlop={12} onPress={() => router.push('/settings')}>
              <Icon name="settings" size={24} color={c.textMuted} />
            </Pressable>
          </Row>
        </Row>

        <WeekStrip
          selected={day}
          today={today}
          onSelect={setDay}
          scoreOf={(d) => evaluateDay(state, d, motivation.rates, d < today).score}
        />

        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 4 }}>
          <Ring t={t} value={stats.kcal / norm} size={236} stroke={16} color={over ? c.over : c.ring}>
            <T size="xxl" bold display>
              {fmt(stats.kcal)}
            </T>
            <T tone="muted">из {fmt(norm)} ккал</T>
            <T size="sm" tone="muted" style={{ marginTop: 4 }}>
              {stats.kcal === 0 ? 'нажми на микрофон' : over ? 'чуть выше плана' : `осталось ${fmt(norm - stats.kcal)}`}
            </T>
          </Ring>

          <Row gap={8} style={{ justifyContent: 'center' }}>
            {result.checks.map((ch) => (
              <View
                key={ch.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 17,
                  backgroundColor: ch.done ? c.doneFill : c.fill,
                }}
              >
                <Icon name={ch.done ? 'check' : 'minus'} size={14} strokeWidth={2.4} color={ch.done ? c.accentText : c.textMuted} />
                <T size="sm" bold={ch.done} tone={ch.done ? 'text' : 'muted'}>
                  {CHECK_LABEL[ch.id]}
                </T>
              </View>
            ))}
          </Row>

          <T size="sm" tone="muted" style={{ textAlign: 'center' }}>
            {reward ? `+${fmt(reward)} ₽ в копилку` : `до +${fmt(rate)} ₽ за день`}
            {'  ·  '}
            {fmt(stats.steps)} шагов
            {stats.activeMinutes ? `  ·  ${stats.activeMinutes} мин спорта` : ''}
          </T>
        </View>

        <View style={{ gap: 2 }}>
          {dayMeals.length === 0 && sessions.length === 0 && (
            <T tone="muted" style={{ textAlign: 'center', paddingVertical: 12 }}>
              {day === today ? 'Пока пусто. Скажи, что ел или как тренировался.' : 'В этот день записей нет. Можно дописать — микрофон запишет сюда.'}
            </T>
          )}
          {dayMeals.map((m) => (
            <EntryRow
              key={m.id}
              time={timeOf(m.at)}
              title={m.items.map((i) => i.name).join(', ')}
              value={`${fmt(m.totals.kcal)} ккал`}
              onDelete={() => askDelete(m.text, () => deleteMeal(m.id))}
            />
          ))}
          {sessions.map((a) => (
            <EntryRow
              key={a.id}
              time={timeOf(a.at)}
              title={`${a.name} · ${a.minutes} мин`}
              value={`−${fmt(a.kcal)} ккал`}
              accent
              onDelete={() => askDelete(a.name, () => deleteSession(day, a.id))}
            />
          ))}
        </View>

        {day === today && pending.length > 0 && (
          <View style={{ gap: 6 }}>
            <T size="sm" tone="muted">
              Ждут интернета
            </T>
            {pending.map((p) => (
              <Row key={p.id} style={{ justifyContent: 'space-between' }}>
                <T style={{ flex: 1 }} numberOfLines={1}>
                  «{p.text}»
                </T>
                <Pressable hitSlop={8} onPress={() => void capture.parsePending(p.text, p.id)}>
                  <T bold style={{ color: c.accentText }}>
                    Разобрать
                  </T>
                </Pressable>
              </Row>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EntryRow({ time, title, value, accent, onDelete }: { time: string; title: string; value: string; accent?: boolean; onDelete: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onLongPress={onDelete}>
      <Row gap={12} style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.sep }}>
        <T size="sm" tone="muted" style={{ width: 44 }}>
          {time}
        </T>
        <T style={{ flex: 1 }} numberOfLines={2}>
          {title}
        </T>
        <T bold style={accent ? { color: c.accentText } : undefined}>
          {value}
        </T>
        <Pressable accessibilityLabel="Удалить" hitSlop={10} onPress={onDelete}>
          <Icon name="close" size={16} color={c.textMuted} />
        </Pressable>
      </Row>
    </Pressable>
  );
}

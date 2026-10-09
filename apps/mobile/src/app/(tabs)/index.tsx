import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealTemplate, sumNutrients } from '@levelup/domain';
import { useCapture } from '@/components/CaptureHost';
import { DayCard } from '@/components/DayCard';
import { Bar, Card, Row, T } from '@/components/ui';
import { WishProgress } from '@/components/WishProgress';
import { Companion } from '@/design/companion/Companion';
import { TemplateChip } from '@/design/components';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { companionState } from '@/lib/companion';
import { fmt, plural } from '@/lib/format';
import { useStore } from '@/state/store';
import { useToday } from '@/state/useToday';
import { useTheme } from '@/theme';

/** Над плавающим таб-баром остаётся место, чтобы последний блок не прятался под стекло. */
export const TAB_BAR_SPACE = 120;

export default function TodayScreen() {
  const t = useTheme();
  const { c } = t;
  const game = useToday();
  const profile = useStore((s) => s.profile);
  const pending = useStore((s) => s.pending.length);
  const capture = useCapture();
  if (!game || !profile) return null;

  const { stats, bank } = game;
  const left = game.norm - stats.kcal;
  const lime = companionState(bank, new Date().getHours());

  const logTemplate = (tpl: MealTemplate) => {
    useStore.getState().addEntry({ sourceText: tpl.label, items: tpl.items, activities: [], unknown: [], questions: [], totals: sumNutrients(tpl.items) });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T size="xl" bold display>
            Сегодня
          </T>
          <Row gap={18}>
            <Pressable accessibilityLabel="Записать текстом" hitSlop={12} onPress={capture.openText}>
              <Icon name="keyboard" size={24} color={c.textMuted} />
            </Pressable>
            <Pressable accessibilityLabel="Настройки" hitSlop={12} onPress={() => router.push('/settings')}>
              <Icon name="settings" size={24} color={c.textMuted} />
            </Pressable>
          </Row>
        </Row>

        <Card style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
          {/* У рисунка Лайма много воздуха сверху (место под листик и корону) — подрезаем, чтобы карточка не пустовала. */}
          <View style={{ height: 120, overflow: 'hidden', alignItems: 'center' }}>
            <View style={{ marginTop: -24 }}>
              <Companion stage={lime.stage} mood={lime.mood} accessory={lime.accessory} size={150} animated />
            </View>
          </View>
          <T bold display size="lg" style={{ textAlign: 'center' }}>
            Лайм · {lime.stageName}
          </T>
          <T style={{ textAlign: 'center' }}>{lime.line}</T>
          {lime.toNext != null && (
            <T size="xs" tone="muted" style={{ textAlign: 'center' }}>
              До следующей стадии — {lime.toNext} {plural(lime.toNext, 'хороший день', 'хороших дня', 'хороших дней')}
            </T>
          )}
        </Card>

        <WishProgress bank={bank} />
        <DayCard day={bank.today} />

        <Card style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <T size="xs" tone="muted">
                Съедено
              </T>
              <T bold display size="xl">
                {fmt(stats.kcal)}{' '}
                <T size="sm" tone="muted">
                  из {fmt(game.norm)} ккал
                </T>
              </T>
            </View>
            <T size="xs" tone="muted">
              {stats.kcal === 0 ? 'скажи, что ел' : left >= 0 ? `осталось ${fmt(left)}` : 'чуть выше плана'}
            </T>
          </Row>
          {/* Превышение — нейтральный цвет, без «красной ошибки». */}
          <Bar value={stats.kcal} max={game.norm} color={left >= 0 ? c.bar : c.over} height={8} />
          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            <Macro label="Б" value={stats.protein} color={c.protein} />
            <Macro label="Ж" value={stats.fat} color={c.fat} />
            <Macro label="У" value={stats.carbs} color={c.carbs} />
          </Row>
        </Card>

        <Pressable onPress={() => router.push('/progress')} accessibilityLabel="Активность за сегодня">
          <Card style={{ flexDirection: 'row', paddingVertical: 12 }}>
            <Stat icon="steps" value={fmt(stats.steps)} label={`из ${fmt(profile.stepsGoal)} шагов`} />
            <Stat icon="workout" value={`${stats.activeMinutes}`} label="мин спорта" />
            <Stat icon="streak" value={fmt(stats.burnedKcal)} label="ккал сожжено" />
          </Card>
        </Pressable>

        {pending > 0 && (
          <Pressable onPress={() => router.push('/diary')}>
            <Card style={{ borderColor: c.warning, paddingVertical: 12 }}>
              <Row gap={10}>
                <Icon name="cloudOff" size={20} color={c.warning} />
                <T style={{ flex: 1 }}>
                  {pending} {pending === 1 ? 'запись ждёт' : 'записи ждут'} интернета
                </T>
                <Icon name="chevronRight" size={18} color={c.textMuted} />
              </Row>
            </Card>
          </Pressable>
        )}

        {game.templates.length > 0 && (
          <View style={{ gap: 8 }}>
            <T bold display>
              Быстро записать
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -16 }}>
              <View style={{ width: 8 }} />
              {game.templates.map((tpl) => (
                <TemplateChip key={tpl.key} t={t} name={tpl.label} kcal={tpl.totals.kcal} onPress={() => logTemplate(tpl)} />
              ))}
              <View style={{ width: 8 }} />
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={20} color={c.accentText} />
      <T bold display size="md">
        {value}
      </T>
      <T size="xs" tone="muted" style={{ textAlign: 'center' }}>
        {label}
      </T>
    </View>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Row gap={4}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <T size="xs" tone="muted">
        {label} {Math.round(value)}
      </T>
    </Row>
  );
}

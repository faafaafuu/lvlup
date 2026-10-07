import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealTemplate, sumNutrients } from '@levelup/domain';
import { Avatar } from '@/components/Avatar';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { HeroHeader } from '@/components/HeroHeader';
import { QuestList } from '@/components/QuestList';
import { Bar, Card, Row, T } from '@/components/ui';
import { OverlayMode, VoiceOverlay } from '@/components/VoiceOverlay';
import { MicButton, TemplateChip } from '@/design/components';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { fmt } from '@/lib/format';
import { useVoice, voiceSupported } from '@/lib/voice';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useMealCapture } from '@/state/useMealCapture';
import { useTheme } from '@/theme';

/** Высота нижней панели с микрофоном — контент прокручивается над ней, а не под ней. */
const DOCK = 104;

export default function HomeScreen() {
  const t = useTheme();
  const { c } = t;
  const game = useGame();
  const profile = useStore((s) => s.profile);
  const look = useStore((s) => s.look);
  const progress = useStore((s) => s.progress);
  const pending = useStore((s) => s.pending.length);
  const capture = useMealCapture();
  const [overlay, setOverlay] = useState<OverlayMode | null>(null);
  const [heard, setHeard] = useState('');

  const handlePhrase = async (text: string) => {
    setHeard(text);
    setOverlay('parsing');
    await capture.parse(text);
    setOverlay(null);
  };
  const voice = useVoice((text) => void handlePhrase(text));

  if (!game || !profile) return null;
  const mode: OverlayMode | null = voice.state === 'listening' ? 'listening' : voice.state === 'error' ? 'error' : overlay;

  const onMic = async () => {
    if (voice.state === 'listening') return voice.stop();
    if (!voiceSupported) return setOverlay('text');
    await voice.start();
  };

  const logTemplate = (tpl: MealTemplate) => {
    useStore.getState().addEntry({ sourceText: tpl.label, items: tpl.items, activities: [], unknown: [], questions: [], totals: sumNutrients(tpl.items) });
  };

  const { stats } = game;
  const left = game.norm - stats.kcal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: DOCK + 24, gap: 14 }}>
        <HeroHeader level={game.level} coins={progress.coins} streak={game.streak} doubleXp={game.doubleXp} />

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
          <Avatar
            sex={profile.sex}
            look={look}
            stage={game.stage}
            outfitId={progress.equipped.outfit}
            accessoryId={progress.equipped.accessory}
            size={92}
            animated
            onPress={() => router.push('/rewards')}
          />
          <View style={{ flex: 1, gap: 8 }}>
            <T size="xs" tone="muted">
              Сегодня
            </T>
            <View>
              <T bold display size="xl">
                {fmt(stats.kcal)}
              </T>
              <T size="sm" tone="muted">
                из {fmt(game.norm)} ккал
              </T>
            </View>
            {/* Превышение — нейтральный цвет, без «красной ошибки». */}
            <Bar value={stats.kcal} max={game.norm} color={left >= 0 ? c.primary : c.over} height={8} />
            <T size="xs" tone="muted">
              {stats.kcal === 0 ? 'Пока пусто — скажи, что ел' : left >= 0 ? `Осталось ${fmt(left)} ккал` : 'Чуть выше плана — это нормально'}
            </T>
            <Row gap={10} style={{ flexWrap: 'wrap' }}>
              <Macro label="Б" value={stats.protein} color={c.protein} />
              <Macro label="Ж" value={stats.fat} color={c.fat} />
              <Macro label="У" value={stats.carbs} color={c.carbs} />
            </Row>
          </View>
        </Card>

        <Pressable onPress={() => router.push('/progress')} accessibilityLabel="Активность за сегодня">
          <Card style={{ flexDirection: 'row', paddingVertical: 12 }}>
            <Stat icon="steps" color={c.xp} value={fmt(stats.steps)} label={`из ${fmt(profile.stepsGoal)} шагов`} />
            <Stat icon="workout" color={c.primary} value={`${stats.activeMinutes}`} label="мин спорта" />
            <Stat icon="streak" color={c.streak} value={fmt(stats.burnedKcal)} label="ккал сожжено" />
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

        <View style={{ gap: 8 }}>
          <T bold display>
            Квесты дня
          </T>
          <QuestList quests={game.quests} />
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: DOCK, backgroundColor: c.bg,
          borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28,
        }}
      >
        <View style={{ width: 52, marginLeft: 20 }} />
        <MicButton t={t} recording={voice.state === 'listening'} onPress={() => void onMic()} />
        <Pressable
          accessibilityLabel="Ввести текстом"
          hitSlop={10}
          onPress={() => setOverlay('text')}
          style={({ pressed }) => ({
            width: 52, height: 52, borderRadius: 26, backgroundColor: pressed ? c.pressed : c.surface,
            alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, marginRight: 20,
          })}
        >
          <Icon name="keyboard" size={22} color={c.text} />
        </Pressable>
      </View>

      <VoiceOverlay
        mode={mode}
        transcript={voice.state === 'listening' ? voice.transcript : heard}
        error={voice.error}
        onStop={voice.stop}
        onCancel={() => {
          voice.cancel();
          voice.reset();
          setOverlay(null);
        }}
        onSwitchToText={() => {
          voice.reset();
          setOverlay('text');
        }}
        onSubmitText={(text) => void handlePhrase(text)}
      />
      <ConfirmSheet draft={capture.draft} source={capture.source} onChange={capture.setDraft} onConfirm={capture.confirm} onCancel={capture.cancel} />
    </SafeAreaView>
  );
}

function Stat({ icon, color, value, label }: { icon: IconName; color: string; value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={20} color={color} />
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

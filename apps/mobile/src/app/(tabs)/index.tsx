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
import { MicButton, TemplateChip } from '@/design/components';
import { Icon } from '@/design/Icon';
import { OverlayMode, VoiceOverlay } from '@/components/VoiceOverlay';
import { fmt } from '@/lib/format';
import { useVoice, voiceSupported } from '@/lib/voice';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useMealCapture } from '@/state/useMealCapture';
import { useTheme } from '@/theme';

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
    useStore.getState().addMeal({ sourceText: tpl.label, items: tpl.items, unknown: [], questions: [], totals: sumNutrients(tpl.items) });
  };

  const left = game.norm - game.stats.kcal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 16 }}>
        <HeroHeader level={game.level} coins={progress.coins} streak={game.streak} doubleXp={game.doubleXp} />

        <View style={{ alignItems: 'center' }}>
          <Avatar
            sex={profile.sex}
            look={look}
            stage={game.stage}
            outfitId={progress.equipped.outfit}
            accessoryId={progress.equipped.accessory}
            size={150}
            animated
            onPress={() => router.push('/rewards')}
          />
        </View>

        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T bold display size="lg">
              {fmt(game.stats.kcal)} <T tone="muted">из {fmt(game.norm)} ккал</T>
            </T>
            <T size="sm" tone="muted">
              {game.stats.kcal === 0 ? 'Пока пусто — скажи, что ел' : left >= 0 ? `Осталось ${fmt(left)}` : 'Чуть выше плана — это нормально'}
            </T>
          </Row>
          {/* Превышение — нейтральный цвет, без «красной ошибки». */}
          <Bar value={game.stats.kcal} max={game.norm} color={left >= 0 ? c.primary : c.over} height={10} />
          <Row gap={14}>
            <Macro label="Б" value={game.stats.protein} color={c.protein} />
            <Macro label="Ж" value={game.stats.fat} color={c.fat} />
            <Macro label="У" value={game.stats.carbs} color={c.carbs} />
          </Row>
        </Card>

        {pending > 0 && (
          <Pressable onPress={() => router.push('/diary')}>
            <Card style={{ borderColor: c.warning }}>
              <Row gap={10}>
                <Icon name="cloudOff" size={20} color={c.warning} />
                <T style={{ flex: 1 }}>
                  {pending} {pending === 1 ? 'запись ждёт' : 'записи ждут'} интернета — открыть дневник
                </T>
              </Row>
            </Card>
          </Pressable>
        )}

        {game.templates.length > 0 && (
          <View style={{ gap: 8 }}>
            <T bold display>Быстро записать</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {game.templates.map((tpl) => (
                <TemplateChip key={tpl.key} t={t} name={tpl.label} kcal={tpl.totals.kcal} onPress={() => logTemplate(tpl)} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T bold display>Квесты дня</T>
          <QuestList quests={game.quests} />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}>
        <Row gap={20}>
          <View style={{ width: 44 }} />
          <MicButton t={t} recording={voice.state === 'listening'} onPress={() => void onMic()} />
          <Pressable accessibilityLabel="Ввести текстом" hitSlop={10} onPress={() => setOverlay('text')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
            <Icon name="keyboard" size={22} color={c.text} />
          </Pressable>
        </Row>
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
        onSubmitText={(t) => void handlePhrase(t)}
      />
      <ConfirmSheet draft={capture.draft} source={capture.source} onChange={capture.setDraft} onConfirm={capture.confirm} onCancel={capture.cancel} />
    </SafeAreaView>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <T size="sm" tone="muted">
        {label} {Math.round(value)} г
      </T>
    </Row>
  );
}

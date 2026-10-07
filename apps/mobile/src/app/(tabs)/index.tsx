import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealTemplate, sumNutrients } from '@levelup/domain';
import { Avatar } from '@/components/Avatar';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { HeroHeader } from '@/components/HeroHeader';
import { MicButton } from '@/components/MicButton';
import { QuestList } from '@/components/QuestList';
import { Bar, Card, Chip, Row, T } from '@/components/ui';
import { OverlayMode, VoiceOverlay } from '@/components/VoiceOverlay';
import { fmt } from '@/lib/format';
import { useVoice, voiceSupported } from '@/lib/voice';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useMealCapture } from '@/state/useMealCapture';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const { c } = useTheme();
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

  const logTemplate = (t: MealTemplate) => {
    useStore.getState().addMeal({ sourceText: t.label, items: t.items, unknown: [], questions: [], totals: sumNutrients(t.items) });
  };

  const left = game.norm - game.stats.kcal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 16 }}>
        <HeroHeader level={game.level} coins={progress.coins} streak={game.streak} doubleXp={game.doubleXp} />

        <Pressable accessibilityLabel="Гардероб героя" onPress={() => router.push('/rewards')} style={{ alignItems: 'center' }}>
          <Avatar sex={profile.sex} look={look} stage={game.stage} outfitId={progress.equipped.outfit} accessoryId={progress.equipped.accessory} size={150} />
        </Pressable>

        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T bold size="lg">
              {fmt(game.stats.kcal)} <T tone="muted">из {fmt(game.norm)} ккал</T>
            </T>
            <T size="sm" tone={left >= 0 ? 'muted' : 'warning'}>
              {left >= 0 ? `ещё ${fmt(left)}` : 'чуть выше плана'}
            </T>
          </Row>
          {/* Превышение — нейтральный цвет, без «красной ошибки». */}
          <Bar value={game.stats.kcal} max={game.norm} color={left >= 0 ? c.primary : c.warning} height={10} />
          <Row gap={14}>
            <Macro label="Б" value={game.stats.protein} color={c.protein} />
            <Macro label="Ж" value={game.stats.fat} color={c.fat} />
            <Macro label="У" value={game.stats.carbs} color={c.carbs} />
          </Row>
        </Card>

        {pending > 0 && (
          <Pressable onPress={() => router.push('/diary')}>
            <Card style={{ borderColor: c.warning }}>
              <T>
                📡 {pending} {pending === 1 ? 'запись ждёт' : 'записи ждут'} интернета — открыть дневник
              </T>
            </Card>
          </Pressable>
        )}

        {game.templates.length > 0 && (
          <View style={{ gap: 8 }}>
            <T bold>Быстро записать</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {game.templates.map((t) => (
                <Chip key={t.key} label={`${t.label} · ${fmt(t.totals.kcal)}`} onPress={() => logTemplate(t)} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T bold>Квесты дня</T>
          <QuestList quests={game.quests} compact />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' }}>
        <Row gap={20}>
          <View style={{ width: 44 }} />
          <MicButton listening={voice.state === 'listening'} onPress={() => void onMic()} />
          <Pressable accessibilityLabel="Ввести текстом" hitSlop={10} onPress={() => setOverlay('text')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
            <T>⌨︎</T>
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

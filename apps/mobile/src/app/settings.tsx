import { useState } from 'react';
import { Alert, ScrollView, Switch, TextInput, View } from 'react-native';
import { ActivityLevel, minHealthyWeight } from '@levelup/domain';
import { Btn, Card, Chip, Row, SectionTitle, Stepper, T, textInputStyle } from '@/components/ui';
import { requestHealthAccess } from '@/lib/health';
import { checkServer } from '@/lib/parse';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

const ACTIVITY: Array<[ActivityLevel, string]> = [
  ['sedentary', 'Сидячая'],
  ['light', 'Лёгкая'],
  ['moderate', 'Средняя'],
  ['high', 'Высокая'],
];

export default function SettingsScreen() {
  const { c } = useTheme();
  const s = useStore();
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmWord, setConfirmWord] = useState('');
  if (!s.profile) return null;
  const p = s.profile;
  const units = s.portions.units ?? {};
  const minTarget = minHealthyWeight(p.heightCm);

  const setUnit = (key: 'plate' | 'cup' | 'tbsp', v: number) =>
    s.updatePortions({ ...s.portions, units: { ...units, [key]: v, ...(key === 'cup' ? { glass: v } : {}) } });

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <SectionTitle>Цель</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>Целевой вес</T>
          <Stepper value={p.targetWeightKg} step={0.5} min={minTarget} suffix=" кг" onChange={(v) => s.updateProfile({ targetWeightKg: Math.max(minTarget, v) })} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>Цель шагов</T>
          <Stepper value={p.stepsGoal} step={500} min={2000} onChange={(v) => s.updateProfile({ stepsGoal: v })} />
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ACTIVITY.map(([id, label]) => (
            <Chip key={id} label={label} active={p.activity === id} onPress={() => s.updateProfile({ activity: id })} />
          ))}
        </View>
      </Card>

      <SectionTitle>Мои порции</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>Тарелка</T>
          <Stepper value={units.plate ?? 300} step={25} min={50} suffix=" г" onChange={(v) => setUnit('plate', v)} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>Кружка</T>
          <Stepper value={units.cup ?? 250} step={25} min={50} suffix=" мл" onChange={(v) => setUnit('cup', v)} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>Ложка</T>
          <Stepper value={units.tbsp ?? 15} step={5} min={5} suffix=" г" onChange={(v) => setUnit('tbsp', v)} />
        </Row>
      </Card>

      <SectionTitle>Распознавание</SectionTitle>
      <Card style={{ gap: 10 }}>
        <T size="sm" tone="muted">
          Сервер с LLM лучше понимает разговорную речь. Без него работает офлайн-разбор прямо на телефоне.
        </T>
        <TextInput
          value={s.settings.apiUrl}
          onChangeText={(apiUrl) => s.updateSettings({ apiUrl })}
          placeholder="https://сервер:3100 (пусто — только офлайн)"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={textInputStyle(c)}
        />
        <TextInput
          value={s.settings.apiToken}
          onChangeText={(apiToken) => s.updateSettings({ apiToken })}
          placeholder="Токен API_TOKEN"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={textInputStyle(c)}
        />
        <Btn
          title="Проверить связь"
          kind="ghost"
          loading={checking}
          disabled={!s.settings.apiUrl}
          onPress={async () => {
            setChecking(true);
            setServerStatus(await checkServer(s.settings));
            setChecking(false);
          }}
        />
        {serverStatus && <T size="sm">{serverStatus}</T>}
      </Card>

      <SectionTitle>Здоровье и напоминания</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T style={{ flex: 1 }}>Шаги, сон, вес из Здоровья</T>
          <Switch
            value={s.settings.health}
            onValueChange={async (on) => {
              if (!on) return s.updateSettings({ health: false });
              const ok = await requestHealthAccess();
              s.updateSettings({ health: ok });
              if (!ok) Alert.alert('Здоровье недоступно', 'На сайдлоад-сборке HealthKit может быть отключён. Шаги и сон можно вводить на экране «Прогресс».');
            }}
          />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T>Напоминания</T>
          <Switch value={s.settings.reminders} onValueChange={(reminders) => s.updateSettings({ reminders })} />
        </Row>
      </Card>

      <SectionTitle>Тема</SectionTitle>
      <Row>
        {(['system', 'dark', 'light'] as const).map((t) => (
          <Chip key={t} label={{ system: 'Как в системе', dark: 'Тёмная', light: 'Светлая' }[t]} active={s.settings.theme === t} onPress={() => s.updateSettings({ theme: t })} />
        ))}
      </Row>

      <SectionTitle>Данные</SectionTitle>
      <Card style={{ gap: 10, borderColor: c.danger }}>
        <T>Удалить все данные: записи, вес, прогресс героя. Отменить нельзя. Всё хранится только на этом телефоне.</T>
        <TextInput value={confirmWord} onChangeText={setConfirmWord} placeholder="Напиши УДАЛИТЬ" placeholderTextColor={c.textMuted} style={textInputStyle(c)} />
        <Btn title="Удалить всё" kind="danger" disabled={confirmWord.trim().toUpperCase() !== 'УДАЛИТЬ'} onPress={() => s.resetAll()} />
      </Card>
    </ScrollView>
  );
}

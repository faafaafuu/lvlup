import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ActivityLevel, minHealthyWeight } from '@levelup/domain';
import { checkServer } from '@/lib/parse';
import { useStore } from '@/state/store';
import { Card, Circ, Cta, Ghost, Lbl, Num, Row, Screen, Sep, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const ACTIVITY: Array<[ActivityLevel, string]> = [
  ['sedentary', 'Сидячая'],
  ['light', 'Лёгкая'],
  ['moderate', 'Средняя'],
  ['high', 'Высокая'],
];

/** Профиль: имя, цель, активность, свои порции, сервер распознавания, удаление данных. */
export default function ProfileScreen() {
  const t = useTheme();
  const s = useStore();
  const [server, setServer] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  if (!s.profile) return null;
  const p = s.profile;
  const units = s.portions.units ?? {};
  const minTarget = minHealthyWeight(p.heightCm);

  const step = (label: string, value: string, minus: () => void, plus: () => void) => (
    <Row style={{ minHeight: 64, justifyContent: 'space-between', paddingHorizontal: 18 }}>
      <Txt>{label}</Txt>
      <Row gap={12}>
        <Circ icon="minus" label="Меньше" size={38} onPress={minus} />
        <Num size={16} style={{ minWidth: 72, textAlign: 'center' }}>
          {value}
        </Num>
        <Circ icon="plus" label="Больше" size={38} onPress={plus} />
      </Row>
    </Row>
  );
  const setUnit = (key: 'plate' | 'cup' | 'tbsp', v: number) =>
    s.updatePortions({ ...s.portions, units: { ...units, [key]: v, ...(key === 'cup' ? { glass: v } : {}) } });
  const input = { color: t.tx, fontSize: 17, minHeight: 56, paddingHorizontal: 18 } as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Row style={{ justifyContent: 'space-between', height: 56 }}>
          <Circ icon="chevronLeft" label="Назад" onPress={() => router.back()} />
          <Lbl style={{ fontSize: 12 }}>Профиль</Lbl>
          <View style={{ width: 44 }} />
        </Row>

        <Card>
          <TextInput value={p.name ?? ''} onChangeText={(name) => s.updateProfile({ name })} placeholder="Имя" placeholderTextColor={t.mu} style={input} />
          <Sep />
          {step('Целевой вес', `${p.targetWeightKg} кг`, () => s.updateProfile({ targetWeightKg: Math.max(minTarget, p.targetWeightKg - 0.5) }), () => s.updateProfile({ targetWeightKg: p.targetWeightKg + 0.5 }))}
          <Sep />
          {step('Шаги в день', String(p.stepsGoal), () => s.updateProfile({ stepsGoal: Math.max(2000, p.stepsGoal - 500) }), () => s.updateProfile({ stepsGoal: p.stepsGoal + 500 }))}
          <Sep />
          <View style={{ padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ACTIVITY.map(([id, label]) => (
              <Pressable key={id} onPress={() => s.updateProfile({ activity: id })} style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: p.activity === id ? t.cta : t.sf2 }}>
                <Txt size={14} color={p.activity === id ? t.onCta : t.tx}>
                  {label}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Card>

        <Lbl style={{ paddingHorizontal: 6, marginTop: 8 }}>Мои порции</Lbl>
        <Card>
          {step('Тарелка', `${units.plate ?? 300} г`, () => setUnit('plate', Math.max(50, (units.plate ?? 300) - 25)), () => setUnit('plate', (units.plate ?? 300) + 25))}
          <Sep />
          {step('Кружка', `${units.cup ?? 250} мл`, () => setUnit('cup', Math.max(50, (units.cup ?? 250) - 25)), () => setUnit('cup', (units.cup ?? 250) + 25))}
          <Sep />
          {step('Ложка', `${units.tbsp ?? 15} г`, () => setUnit('tbsp', Math.max(5, (units.tbsp ?? 15) - 5)), () => setUnit('tbsp', (units.tbsp ?? 15) + 5))}
        </Card>

        <Lbl style={{ paddingHorizontal: 6, marginTop: 8 }}>Сервер распознавания</Lbl>
        <Card>
          <TextInput value={s.settings.apiUrl} onChangeText={(apiUrl) => s.updateSettings({ apiUrl })} placeholder="Свой адрес (пусто — сервер Хрума)" placeholderTextColor={t.mu} autoCapitalize="none" autoCorrect={false} style={input} />
          <Sep />
          <TextInput value={s.settings.apiToken} onChangeText={(apiToken) => s.updateSettings({ apiToken })} placeholder="Токен" placeholderTextColor={t.mu} autoCapitalize="none" autoCorrect={false} secureTextEntry style={input} />
        </Card>
        <Ghost
          title={checking ? 'Проверяю…' : 'Проверить связь'}
          disabled={checking}
          onPress={async () => {
            setChecking(true);
            setServer(await checkServer(s.settings));
            setChecking(false);
          }}
        />
        {server && <Txt size={14} muted>{server}</Txt>}

        <Cta
          title="Удалить все данные"
          style={{ marginTop: 24 }}
          onPress={() =>
            Alert.alert('Удалить всё?', 'Записи, вес и прогресс исчезнут без возможности восстановить.', [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Удалить', style: 'destructive', onPress: () => s.resetAll() },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

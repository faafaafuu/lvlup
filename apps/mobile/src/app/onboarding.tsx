import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityLevel, Profile, Sex, dailyCalorieTarget, minHealthyWeight } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { fmt } from '@/lib/format';
import { requestHealthAccess } from '@/lib/health';
import { syncHealth } from '@/lib/healthSync';
import { syncReminders } from '@/lib/notifications';
import { useStore } from '@/state/store';
import { Card, Cta, Lbl, Rings, Row, Screen, Sep, Toggle, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const ACTIVITY: Array<[ActivityLevel, string]> = [
  ['sedentary', 'Сидячая'],
  ['light', 'Немного хожу'],
  ['moderate', 'Тренировки 3–4 раза'],
  ['high', 'Много спорта'],
];

/** Онбординг из макета: «Просто скажи, что съел» → о себе → Здоровье и напоминания. */
export default function Onboarding() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const complete = useStore((s) => s.completeOnboarding);
  const updateSettings = useStore((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex>('male');
  const [f, setF] = useState({ name: '', height: '', weight: '', target: '', age: '' });
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [health, setHealth] = useState(false);
  const [notif, setNotif] = useState(false);

  const num = (v: string) => Number(v.replace(',', '.'));
  const heightCm = num(f.height);
  const weightKg = num(f.weight);
  const targetKg = num(f.target);
  const age = num(f.age);
  const valid = heightCm >= 120 && heightCm <= 230 && weightKg >= 35 && weightKg <= 300 && age >= 14 && age <= 100 && targetKg > 0;
  const minTarget = heightCm >= 120 ? minHealthyWeight(heightCm) : 0;
  const tooLow = targetKg > 0 && heightCm >= 120 && targetKg < minTarget;
  const profile: Profile | null = valid ? { name: f.name.trim() || undefined, sex, age, heightCm, startWeightKg: weightKg, targetWeightKg: targetKg, activity, stepsGoal: 8000 } : null;

  const finish = () => {
    if (!profile) return;
    updateSettings({ health, reminders: notif });
    complete(profile, { units: { plate: 300, cup: 250, glass: 250, tbsp: 15 }, foods: {} });
    if (health) void syncHealth(30);
  };

  const field = (key: keyof typeof f, placeholder: string, numeric = true) => (
    <TextInput
      value={f[key]}
      onChangeText={(v) => setF({ ...f, [key]: v })}
      placeholder={placeholder}
      placeholderTextColor={t.mu}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      style={{ flex: 1, color: t.tx, fontSize: 17, minHeight: 56, paddingHorizontal: 18 }}
    />
  );
  const dots = (
    <Row gap={6}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: i === step ? t.tx : t.track }} />
      ))}
    </Row>
  );
  const bottom = Math.max(insets.bottom, 16) + 8;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 0 && (
          <View style={{ flex: 1, paddingHorizontal: 32 }}>
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Rings size={Math.min(260, width - 110)} food={0.72} steps={0.6} xp={0.34}>
                <Icon name="mic" size={40} strokeWidth={1.6} color={t.tx} />
              </Rings>
            </View>
            <View style={{ flex: 1 }} />
            <Txt size={34} weight="300" style={{ lineHeight: 40 }}>
              Просто скажи,{'\n'}что съел
            </Txt>
            <Txt size={17} muted style={{ marginTop: 14, lineHeight: 23 }}>
              Я посчитаю калории и начислю опыт. Без запретов и ручного подсчёта.
            </Txt>
            <View style={{ marginTop: 24, marginBottom: 32 }}>{dots}</View>
            <Cta title="Начать" onPress={() => setStep(1)} style={{ marginBottom: bottom }} />
          </View>
        )}

        {step === 1 && (
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: bottom + 80, gap: 14 }} keyboardShouldPersistTaps="handled">
            <Txt size={30} weight="300" style={{ marginTop: 24 }}>
              О тебе
            </Txt>
            <Txt muted>Чтобы посчитать твою норму калорий.</Txt>
            <Row gap={8}>
              {(['male', 'female'] as const).map((x) => (
                <Pressable key={x} onPress={() => setSex(x)} style={{ height: 40, paddingHorizontal: 18, borderRadius: 20, justifyContent: 'center', backgroundColor: sex === x ? t.cta : t.sf2 }}>
                  <Txt size={15} color={sex === x ? t.onCta : t.tx}>
                    {x === 'male' ? 'Мужчина' : 'Женщина'}
                  </Txt>
                </Pressable>
              ))}
            </Row>
            <Card>
              {field('name', 'Имя (необязательно)', false)}
              <Sep />
              <Row gap={0}>
                {field('height', 'Рост, см')}
                {field('age', 'Возраст')}
              </Row>
              <Sep />
              <Row gap={0}>
                {field('weight', 'Вес, кг')}
                {field('target', 'Цель, кг')}
              </Row>
            </Card>
            <Lbl style={{ marginTop: 6 }}>Активность</Lbl>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ACTIVITY.map(([id, label]) => (
                <Pressable key={id} onPress={() => setActivity(id)} style={{ height: 38, paddingHorizontal: 14, borderRadius: 19, justifyContent: 'center', backgroundColor: activity === id ? t.cta : t.sf2 }}>
                  <Txt size={14} color={activity === id ? t.onCta : t.tx}>
                    {label}
                  </Txt>
                </Pressable>
              ))}
            </View>
            {tooLow && <Txt color={t.xp}>Цель ниже здорового веса для твоего роста. Минимум — {minTarget} кг.</Txt>}
            {profile && !tooLow && (
              <Txt muted>
                Твоя норма — <Txt>{fmt(dailyCalorieTarget(profile))} ккал</Txt> в день.
              </Txt>
            )}
          </ScrollView>
        )}

        {step === 2 && (
          <View style={{ flex: 1, padding: 24, gap: 14 }}>
            <Txt size={30} weight="300" style={{ marginTop: 24 }}>
              Почти готово
            </Txt>
            <Txt muted>Шаги, сон, вес и тренировки с часов подтянутся сами.</Txt>
            <Card>
              <Row style={{ minHeight: 56, paddingHorizontal: 18, justifyContent: 'space-between' }}>
                <Txt>Apple Здоровье</Txt>
                <Toggle label="Apple Здоровье" value={health} onChange={async (v) => setHealth(v ? (await requestHealthAccess()).ok : false)} />
              </Row>
              <Sep />
              <Row style={{ minHeight: 56, paddingHorizontal: 18, justifyContent: 'space-between' }}>
                <Txt>Напоминания</Txt>
                <Toggle label="Напоминания" value={notif} onChange={async (v) => setNotif(v ? await syncReminders(true) : false)} />
              </Row>
            </Card>
            <Txt size={14} muted>
              Микрофон iPhone спросит при первом нажатии на красную кнопку.
            </Txt>
          </View>
        )}

        {step > 0 && (
          <View style={{ paddingHorizontal: 24, paddingBottom: bottom, gap: 16 }}>
            {dots}
            <Row>
              <Pressable onPress={() => setStep(step - 1)} style={{ height: 56, paddingHorizontal: 22, justifyContent: 'center' }}>
                <Txt muted>Назад</Txt>
              </Pressable>
              {step === 1 ? (
                <Cta title="Далее" style={{ flex: 1 }} disabled={!valid || tooLow} onPress={() => setStep(2)} />
              ) : (
                <Cta title="Готово" style={{ flex: 1 }} onPress={finish} />
              )}
            </Row>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

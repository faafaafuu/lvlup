import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityLevel, Profile, Sex, UserPortions, dailyCalorieTarget, minHealthyWeight } from '@levelup/domain';
import { Avatar, HAIR_COLORS, SKIN_TONES } from '@/components/Avatar';
import { Btn, Card, Chip, Row, Stepper, T, textInputStyle } from '@/components/ui';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { requestHealthAccess } from '@/lib/health';
import { syncReminders } from '@/lib/notifications';
import { AvatarLook, useStore } from '@/state/store';
import { useTheme } from '@/theme';

const ACTIVITY: Array<[ActivityLevel, string]> = [
  ['sedentary', 'Сидячая работа'],
  ['light', 'Немного хожу'],
  ['moderate', 'Тренировки 3–4 раза'],
  ['high', 'Много спорта'],
];

const STEPS = 5;

export default function Onboarding() {
  const { c } = useTheme();
  const complete = useStore((s) => s.completeOnboarding);
  const updateSettings = useStore((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex>('male');
  const [look, setLook] = useState<AvatarLook>({ skin: SKIN_TONES[1]!, hair: 0, hairColor: HAIR_COLORS[1]! });
  const [f, setF] = useState({ height: '', weight: '', target: '', age: '' });
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [portions, setPortions] = useState({ plate: 300, cup: 250, sandwich: 80, tbsp: 15 });
  const [health, setHealth] = useState<boolean | null>(null);
  const [notif, setNotif] = useState<boolean | null>(null);

  const num = (v: string) => Number(v.replace(',', '.'));
  const heightCm = num(f.height);
  const weightKg = num(f.weight);
  const targetKg = num(f.target);
  const age = num(f.age);
  const paramsValid = heightCm >= 120 && heightCm <= 230 && weightKg >= 35 && weightKg <= 300 && age >= 14 && age <= 100 && targetKg > 0;
  const minTarget = heightCm >= 120 ? minHealthyWeight(heightCm) : 0;
  const targetTooLow = targetKg > 0 && heightCm >= 120 && targetKg < minTarget;

  const profile: Profile | null = paramsValid
    ? { sex, age, heightCm, startWeightKg: weightKg, targetWeightKg: targetKg, activity, stepsGoal: 8000 }
    : null;

  const finish = () => {
    if (!profile) return;
    const userPortions: UserPortions = {
      units: { plate: portions.plate, cup: portions.cup, glass: portions.cup, tbsp: portions.tbsp },
      foods: { sandwich: portions.sandwich, sandwich_sausage: portions.sandwich, sandwich_cheese: portions.sandwich },
    };
    updateSettings({ health: health === true, reminders: notif !== false });
    complete(profile, look, userPortions);
  };

  const field = (key: keyof typeof f, placeholder: string) => (
    <TextInput
      value={f[key]}
      onChangeText={(v) => setF({ ...f, [key]: v })}
      placeholder={placeholder}
      placeholderTextColor={c.textMuted}
      keyboardType="decimal-pad"
      style={[textInputStyle(c), { flex: 1 }]}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Row style={{ justifyContent: 'center', paddingTop: 8 }} gap={6}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? c.primary : c.border }} />
          ))}
        </Row>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              <Avatar sex={sex} look={look} stage={0} outfitId="outfit_violet" pose="wave" size={160} animated />
              <T size="xxl" bold display style={{ textAlign: 'center' }}>
                Level Up
              </T>
              <T size="lg" tone="muted" style={{ textAlign: 'center' }}>
                Прокачай себя. Записывай еду голосом за 10 секунд — герой растёт вместе с тобой.
              </T>
            </View>
          )}

          {step === 1 && (
            <>
              <T size="xl" bold display>
                Твой герой
              </T>
              <View style={{ alignItems: 'center' }}>
                <Avatar sex={sex} look={look} stage={0} outfitId="outfit_violet" size={140} />
              </View>
              <Row>
                <Chip label="Мужчина" active={sex === 'male'} onPress={() => setSex('male')} />
                <Chip label="Женщина" active={sex === 'female'} onPress={() => setSex('female')} />
              </Row>
              <T bold>Тон кожи</T>
              <Row>
                {SKIN_TONES.map((t) => (
                  <Swatch key={t} color={t} active={look.skin === t} onPress={() => setLook({ ...look, skin: t })} />
                ))}
              </Row>
              <T bold>Причёска</T>
              <Row>
                {([0, 1, 2] as const).map((h) => (
                  <Chip key={h} label={`Вариант ${h + 1}`} active={look.hair === h} onPress={() => setLook({ ...look, hair: h })} />
                ))}
              </Row>
              <Row>
                {HAIR_COLORS.map((t) => (
                  <Swatch key={t} color={t} active={look.hairColor === t} onPress={() => setLook({ ...look, hairColor: t })} />
                ))}
              </Row>
            </>
          )}

          {step === 2 && (
            <>
              <T size="xl" bold display>
                Параметры
              </T>
              <Row>
                {field('height', 'Рост, см')}
                {field('age', 'Возраст')}
              </Row>
              <Row>
                {field('weight', 'Вес, кг')}
                {field('target', 'Цель, кг')}
              </Row>
              <T bold>Активность</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ACTIVITY.map(([id, label]) => (
                  <Chip key={id} label={label} active={activity === id} onPress={() => setActivity(id)} />
                ))}
              </View>
              {targetTooLow && (
                <Card style={{ borderColor: c.warning }}>
                  <T>
                    Цель ниже здорового веса для твоего роста. Минимум — {minTarget} кг: так герой будет сильным, а не истощённым.
                  </T>
                </Card>
              )}
              {profile && !targetTooLow && (
                <Card>
                  <T tone="muted">Твоя дневная норма</T>
                  <T size="xl" bold>
                    {dailyCalorieTarget(profile)} ккал
                  </T>
                </Card>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <T size="xl" bold display>
                Ленивый режим
              </T>
              <T tone="muted">Один раз скажи, какая у тебя посуда — дальше «тарелка плова» будет считаться по твоей тарелке.</T>
              <PortionRow icon="plate" label="Моя тарелка" value={portions.plate} unit=" г" step={25} onChange={(v) => setPortions({ ...portions, plate: v })} />
              <PortionRow icon="mug" label="Моя кружка" value={portions.cup} unit=" мл" step={25} onChange={(v) => setPortions({ ...portions, cup: v })} />
              <PortionRow icon="sandwich" label="Мой бутерброд" value={portions.sandwich} unit=" г" step={10} onChange={(v) => setPortions({ ...portions, sandwich: v })} />
              <PortionRow icon="spoon" label="Моя ложка" value={portions.tbsp} unit=" г" step={5} onChange={(v) => setPortions({ ...portions, tbsp: v })} />
            </>
          )}

          {step === 4 && (
            <>
              <T size="xl" bold display>
                Разрешения
              </T>
              <Card style={{ gap: 8 }}>
                <Row gap={10}><PermIcon name="health" /><T bold>Здоровье</T></Row>
                <T tone="muted">Шаги, сон и вес подтянутся сами — за них начисляется опыт.</T>
                <Btn
                  title={health === true ? 'Подключено' : health === false ? 'Недоступно — введу вручную' : 'Разрешить'}
                  kind={health === null ? 'primary' : 'ghost'}
                  disabled={health !== null}
                  onPress={async () => setHealth((await requestHealthAccess()).ok)}
                />
              </Card>
              <Card style={{ gap: 8 }}>
                <Row gap={10}><PermIcon name="bell" /><T bold>Напоминания</T></Row>
                <T tone="muted">Два мягких напоминания в день: про обед и про квесты.</T>
                <Btn
                  title={notif === true ? 'Включены' : notif === false ? 'Не разрешено' : 'Разрешить'}
                  kind={notif === null ? 'primary' : 'ghost'}
                  disabled={notif !== null}
                  onPress={async () => setNotif(await syncReminders(true))}
                />
              </Card>
              <Card style={{ gap: 8 }}>
                <Row gap={10}><PermIcon name="mic" /><T bold>Микрофон</T></Row>
                <T tone="muted">iPhone спросит при первом нажатии на микрофон.</T>
              </Card>
            </>
          )}
        </ScrollView>
        <View style={{ padding: 20, gap: 8 }}>
          {step < STEPS - 1 ? (
            <Btn title="Далее" disabled={step === 2 && (!paramsValid || targetTooLow)} onPress={() => setStep(step + 1)} />
          ) : (
            <Btn title="В путь!" onPress={finish} disabled={!profile} />
          )}
          {step > 0 && <Btn title="Назад" kind="ghost" onPress={() => setStep(step - 1)} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PermIcon({ name }: { name: IconName }) {
  const { c } = useTheme();
  return <Icon name={name} size={22} color={c.primary} />;
}

function Swatch({ color, active, onPress }: { color: string; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Chip
      label=" "
      onPress={onPress}
      style={{ width: 40, height: 40, padding: 0, backgroundColor: color, borderColor: active ? c.primary : c.border, borderWidth: active ? 3 : 1 }}
    />
  );
}

function PortionRow({ icon, label, value, unit, step, onChange }: { icon: IconName; label: string; value: number; unit: string; step: number; onChange: (v: number) => void }) {
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10}>
          <PermIcon name={icon} />
          <T bold>{label}</T>
        </Row>
        <Stepper value={value} step={step} min={step} suffix={unit} onChange={onChange} />
      </Row>
    </Card>
  );
}

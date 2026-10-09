import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityLevel, Profile, Sex, UserPortions, dailyCalorieTarget, minHealthyWeight } from '@levelup/domain';
import { Btn, Card, Chip, Row, Stepper, T, textInputStyle } from '@/components/ui';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { requestHealthAccess } from '@/lib/health';
import { syncReminders } from '@/lib/notifications';
import { useStore } from '@/state/store';
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
  const [f, setF] = useState({ height: '', weight: '', target: '', age: '' });
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [portions, setPortions] = useState({ plate: 300, cup: 250, sandwich: 80, tbsp: 15 });
  const [wish, setWish] = useState({ title: '', price: '' });
  const [rate, setRate] = useState(100);
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
  const wishPrice = Number(wish.price.replace(/\s/g, ''));

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
    complete(profile, userPortions, wish.title.trim() && wishPrice > 0 ? { title: wish.title.trim(), price: wishPrice } : null, rate);
  };

  const field = (key: keyof typeof f, placeholder: string) => (
    <TextInput
      value={f[key]}
      onChangeText={(v) => setF({ ...f, [key]: v })}
      placeholder={placeholder}
      placeholderTextColor={c.textMuted}
      keyboardType="decimal-pad"
      style={[textInputStyle(c), { flex: 1, minWidth: 0 }]}
    />
  );

  const daysTo = wishPrice > 0 && rate > 0 ? Math.ceil(wishPrice / rate) : null;

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
            <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
              <T size="xxl" bold display>
                Хорошие дни{'\n'}= реальные награды
              </T>
              <Point icon="mic" text="Говоришь, что съел или как тренировался, — запись за 10 секунд." />
              <Point icon="check" text="Каждый день три простых условия: записать еду, уложиться в план, подвигаться." />
              <Point icon="coin" text="Хорошие дни наполняют копилку на то, что ты правда хочешь: кроссовки, массаж, поездку." />
              <Point icon="workout" text="Видишь, как растут твои настоящие показатели: дисциплина, сила, выносливость, форма." />
            </View>
          )}

          {step === 1 && (
            <>
              <T size="xl" bold display>
                О тебе
              </T>
              <Row>
                <Chip label="Мужчина" active={sex === 'male'} onPress={() => setSex('male')} />
                <Chip label="Женщина" active={sex === 'female'} onPress={() => setSex('female')} />
              </Row>
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
                  <T>Цель ниже здорового веса для твоего роста. Минимум — {minTarget} кг.</T>
                </Card>
              )}
              {profile && !targetTooLow && (
                <Card>
                  <T tone="muted">Твой дневной план</T>
                  <T size="xl" bold display>
                    {dailyCalorieTarget(profile)} ккал
                  </T>
                </Card>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <T size="xl" bold display>
                Твоя посуда
              </T>
              <T tone="muted">Один раз — и «тарелка плова» будет считаться по твоей тарелке, а не по средней.</T>
              <PortionRow icon="plate" label="Тарелка" value={portions.plate} unit=" г" step={25} onChange={(v) => setPortions({ ...portions, plate: v })} />
              <PortionRow icon="mug" label="Кружка" value={portions.cup} unit=" мл" step={25} onChange={(v) => setPortions({ ...portions, cup: v })} />
              <PortionRow icon="sandwich" label="Бутерброд" value={portions.sandwich} unit=" г" step={10} onChange={(v) => setPortions({ ...portions, sandwich: v })} />
              <PortionRow icon="spoon" label="Ложка" value={portions.tbsp} unit=" г" step={5} onChange={(v) => setPortions({ ...portions, tbsp: v })} />
            </>
          )}

          {step === 3 && (
            <>
              <T size="xl" bold display>
                На что копишь?
              </T>
              <T tone="muted">Реальная вещь, которую купишь себе, когда заработаешь хорошими днями. Можно пропустить и добавить позже.</T>
              <TextInput value={wish.title} onChangeText={(title) => setWish({ ...wish, title })} placeholder="Например: новые кроссовки" placeholderTextColor={c.textMuted} style={textInputStyle(c)} />
              <TextInput value={wish.price} onChangeText={(price) => setWish({ ...wish, price })} keyboardType="number-pad" placeholder="Сколько стоит, ₽" placeholderTextColor={c.textMuted} style={textInputStyle(c)} />
              <Card style={{ gap: 10 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T bold style={{ flex: 1 }}>
                    За идеальный день
                  </T>
                  <Stepper value={rate} step={50} min={50} suffix=" ₽" onChange={setRate} />
                </Row>
                <T size="sm" tone="muted">
                  Столько ты разрешаешь себе потратить на награду за день, когда выполнены все три условия.
                  {daysTo ? ` Такая награда — примерно ${daysTo} хороших дней.` : ''}
                </T>
              </Card>
            </>
          )}

          {step === 4 && (
            <>
              <T size="xl" bold display>
                Разрешения
              </T>
              <Card style={{ gap: 8 }}>
                <Row gap={10}>
                  <Icon name="health" size={22} color={c.primary} />
                  <T bold>Здоровье</T>
                </Row>
                <T tone="muted">Шаги, сон, вес и тренировки с часов подтянутся сами.</T>
                <Btn
                  title={health === true ? 'Подключено' : health === false ? 'Недоступно — введу вручную' : 'Разрешить'}
                  kind={health === null ? 'primary' : 'ghost'}
                  disabled={health !== null}
                  onPress={async () => setHealth((await requestHealthAccess()).ok)}
                />
              </Card>
              <Card style={{ gap: 8 }}>
                <Row gap={10}>
                  <Icon name="bell" size={22} color={c.primary} />
                  <T bold>Напоминания</T>
                </Row>
                <T tone="muted">Два в день: про обед и вечерний итог.</T>
                <Btn
                  title={notif === true ? 'Включены' : notif === false ? 'Не разрешено' : 'Разрешить'}
                  kind={notif === null ? 'primary' : 'ghost'}
                  disabled={notif !== null}
                  onPress={async () => setNotif(await syncReminders(true))}
                />
              </Card>
            </>
          )}
        </ScrollView>
        <View style={{ padding: 20, gap: 8 }}>
          {step < STEPS - 1 ? (
            <Btn title="Далее" disabled={step === 1 && (!paramsValid || targetTooLow)} onPress={() => setStep(step + 1)} />
          ) : (
            <Btn title="Начать" onPress={finish} disabled={!profile} />
          )}
          {step > 0 && <Btn title="Назад" kind="ghost" onPress={() => setStep(step - 1)} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Point({ icon, text }: { icon: IconName; text: string }) {
  const { c } = useTheme();
  return (
    <Row gap={14} style={{ alignItems: 'flex-start' }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={c.primary} />
      </View>
      <T style={{ flex: 1 }}>{text}</T>
    </Row>
  );
}

function PortionRow({ icon, label, value, unit, step, onChange }: { icon: IconName; label: string; value: number; unit: string; step: number; onChange: (v: number) => void }) {
  const { c } = useTheme();
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10}>
          <Icon name={icon} size={22} color={c.primary} />
          <T bold>{label}</T>
        </Row>
        <Stepper value={value} step={step} min={step} suffix={unit} onChange={onChange} />
      </Row>
    </Card>
  );
}

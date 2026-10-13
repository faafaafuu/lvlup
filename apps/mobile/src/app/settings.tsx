import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/design/Icon';
import { fmt } from '@/lib/format';
import { requestHealthAccess } from '@/lib/health';
import { syncHealth } from '@/lib/healthSync';
import { syncReminders } from '@/lib/notifications';
import { useDay } from '@/state/useDay';
import { useStore } from '@/state/store';
import { Card, Circ, Ghost, Lbl, Row, Screen, Seg, Sep, Toggle, Txt } from '@/ui/kit';
import { ThemePref, useTheme } from '@/ui/theme';

const THEMES: Array<[ThemePref, string]> = [
  ['dark', 'Тёмная'],
  ['cobalt', 'Кобальт'],
  ['carpet', 'Ковёр'],
  ['system', 'Авто'],
];

/** Настройки из макета: профиль, тема, цель, переключатели. */
export default function Settings() {
  const t = useTheme();
  const d = useDay();
  const s = useStore();
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (!d || !s.profile) return null;
  const profile = s.profile;

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await syncHealth(30);
      setNote(`Шаги за ${r.steps} дн., тренировок ${r.workouts}, взвешиваний ${r.weights}. Если везде ноль — Здоровье → Профиль → Приложения → Хрум → разреши всё.`);
    } finally {
      setSyncing(false);
    }
  };

  const editGoal = () =>
    Alert.prompt?.('Цель калорий', 'Сколько ккал в день? Пусто — посчитать по формуле.', (v) => {
      const n = Number(String(v).replace(/\s/g, ''));
      s.updateProfile({ kcalGoal: n >= 800 && n <= 6000 ? Math.round(n) : null });
    }, 'plain-text', profile.kcalGoal ? String(profile.kcalGoal) : '', 'number-pad');

  const row = (children: React.ReactNode) => <Row style={{ minHeight: 56, justifyContent: 'space-between', paddingHorizontal: 18 }}>{children}</Row>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 14 }}>
        <Row style={{ justifyContent: 'space-between', height: 56 }}>
          <Circ icon="chevronLeft" label="Назад" onPress={() => router.back()} />
          <Lbl style={{ fontSize: 12 }}>Настройки</Lbl>
          <View style={{ width: 44 }} />
        </Row>

        <Card onPress={() => router.push('/profile')} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.sf2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={22} color={t.tx} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={20} weight="600">
              {s.profile.name || 'Профиль'}
            </Txt>
            <Txt size={15} muted>
              Цель {fmt(d.norm)} ккал · LV {String(d.game.level).padStart(2, '0')}
            </Txt>
          </View>
          <Icon name="chevronRight" size={18} color={t.mu} />
        </Card>

        <Card>
          {row(
            <>
              <Txt>Тема</Txt>
              <Seg items={THEMES.map(([, l]) => l)} value={Math.max(0, THEMES.findIndex(([k]) => k === s.settings.theme))} onChange={(i) => s.updateSettings({ theme: THEMES[i]![0] })} />
            </>,
          )}
          <Sep />
          <Card onPress={editGoal} style={{ borderWidth: 0, backgroundColor: 'transparent' }}>
            {row(
              <>
                <Txt>Цель калорий</Txt>
                <Txt muted>
                  {fmt(d.norm)}
                  {s.profile.kcalGoal ? '' : ' · авто'}
                </Txt>
              </>,
            )}
          </Card>
          <Sep />
          {row(
            <>
              <Txt>Язык голоса</Txt>
              <Txt muted>Русский</Txt>
            </>,
          )}
        </Card>

        <Card>
          {row(
            <>
              <Txt>Напоминания</Txt>
              <Toggle
                label="Напоминания"
                value={s.settings.reminders}
                onChange={(v) => {
                  s.updateSettings({ reminders: v });
                  void syncReminders(v);
                }}
              />
            </>,
          )}
          <Sep />
          {row(
            <>
              <Txt>Apple Здоровье</Txt>
              <Toggle
                label="Apple Здоровье"
                value={s.settings.health}
                onChange={async (on) => {
                  if (!on) return s.updateSettings({ health: false });
                  const r = await requestHealthAccess();
                  s.updateSettings({ health: r.ok });
                  if (!r.ok) return Alert.alert('Здоровье недоступно', `Причина: ${r.reason}`);
                  await runSync();
                }}
              />
            </>,
          )}
          {s.settings.health && (
            <View style={{ paddingHorizontal: 18, paddingBottom: 14, gap: 10 }}>
              <Txt size={14} muted>
                {syncing
                  ? 'Синхронизирую…'
                  : note ??
                    (s.settings.healthSyncedAt
                      ? `Обновлено ${new Date(s.settings.healthSyncedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
                      : 'Ещё не синхронизировалось')}
              </Txt>
              <Ghost title="Подтянуть за 30 дней" onPress={() => void runSync()} disabled={syncing} />
            </View>
          )}
          <Sep />
          {row(
            <>
              <Txt>Вибрация наград</Txt>
              <Toggle label="Вибрация наград" value={s.settings.rewardHaptics} onChange={(v) => s.updateSettings({ rewardHaptics: v })} />
            </>,
          )}
          <Sep />
          {row(
            <>
              <Txt>Dynamic Island</Txt>
              <Toggle label="Dynamic Island" value={s.settings.island !== false} onChange={(v) => s.updateSettings({ island: v })} />
            </>,
          )}
        </Card>

        <Txt size={14} muted style={{ paddingHorizontal: 6 }}>
          Шаги, сон, вес и тренировки берутся из Apple Здоровье. Записи о еде хранятся только у тебя.
        </Txt>

        <Card>
          {row(
            <>
              <Txt>Siri</Txt>
              <Txt size={14} muted style={{ flex: 1, textAlign: 'right' }}>
                «Привет, Siri, добавь в Хрум»
              </Txt>
            </>,
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

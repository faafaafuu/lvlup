import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACHIEVEMENTS, SHOP_ITEMS, activeDays, isUnlocked, rescuableDay } from '@levelup/domain';
import { Avatar } from '@/components/Avatar';
import { QuestList } from '@/components/QuestList';
import { Btn, Card, Row, SectionTitle, T } from '@/components/ui';
import { useStore } from '@/state/store';
import { useGame } from '@/state/useGame';
import { useTheme } from '@/theme';

export default function RewardsScreen() {
  const { c } = useTheme();
  const game = useGame();
  const s = useStore();
  if (!game || !s.profile) return null;
  const { progress } = s;
  const unlockedAch = new Set(progress.achievements);
  const rescuable = rescuableDay(activeDays({ profile: s.profile, meals: s.meals, activity: s.activity, weights: s.weights, progress }), game.today, progress.frozenDays);

  const buy = (id: string) => {
    const err = s.buy(id);
    if (err) Alert.alert('Не получилось', err);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <SectionTitle right={<T tone="muted" size="sm">обновятся в полночь</T>}>Квесты дня</SectionTitle>
        <QuestList quests={game.quests} />
        <T size="sm" tone="muted">
          Выполни все три — получишь сундук с монетами 🎁
        </T>

        <SectionTitle>Достижения</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ACHIEVEMENTS.map((a) => {
            const got = unlockedAch.has(a.id);
            return (
              <Card key={a.id} style={{ width: '48.5%', gap: 4, opacity: got ? 1 : 0.55, borderColor: got ? c.coin : c.border }}>
                <T size="xl">{got ? '🏆' : '🔒'}</T>
                <T bold>{a.title}</T>
                <T size="xs" tone="muted">
                  {a.description}
                </T>
              </Card>
            );
          })}
        </View>

        <SectionTitle right={<T bold tone="coin">● {progress.coins}</T>}>Гардероб</SectionTitle>
        <Card style={{ alignItems: 'center' }}>
          <Avatar sex={s.profile.sex} look={s.look} stage={game.stage} outfitId={progress.equipped.outfit} accessoryId={progress.equipped.accessory} size={110} />
        </Card>
        {SHOP_ITEMS.filter((i) => i.slot !== 'booster').map((item) => {
          const open = isUnlocked(item, game.level.level, progress.inventory);
          const worn = progress.equipped[item.slot] === item.id;
          return (
            <Card key={item.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={10} style={{ flex: 1 }}>
                  {item.slot === 'outfit' ? (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: item.value }} />
                  ) : (
                    <T size="lg">{({ headband: '🎽', cape: '🦸', crown: '👑', glasses: '🕶' } as Record<string, string>)[item.value] ?? '✨'}</T>
                  )}
                  <T bold>{item.name}</T>
                </Row>
                {open ? (
                  <Btn title={worn ? 'Надето' : 'Надеть'} kind={worn ? 'ghost' : 'primary'} onPress={() => s.equip(item.id)} style={{ minHeight: 38 }} />
                ) : item.price ? (
                  <Btn title={`Купить · ${item.price}`} disabled={progress.coins < item.price} onPress={() => buy(item.id)} style={{ minHeight: 38 }} />
                ) : (
                  <T tone="muted">🔒 Ур. {item.unlockLevel}</T>
                )}
              </Row>
            </Card>
          );
        })}

        <SectionTitle>Бустеры</SectionTitle>
        <Card style={{ gap: 10 }}>
          <T bold>Двойной XP на сегодня · 100 монет</T>
          <Btn title={game.doubleXp ? 'Активен' : 'Активировать'} disabled={game.doubleXp || progress.coins < 100} onPress={() => buy('boost_double_xp')} />
        </Card>
        <Card style={{ gap: 10 }}>
          <T bold>Спасти серию · 50 монет</T>
          <T size="sm" tone="muted">
            {rescuable ? 'Вчера пропуск — заморозка сохранит огонь серии.' : 'Серия не прерывалась, спасать нечего.'}
          </T>
          <Btn title="Заморозить пропуск" disabled={!rescuable || progress.coins < 50} onPress={() => buy('boost_freeze')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

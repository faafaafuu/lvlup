import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Achievement, XP_PER_LEVEL } from '@levelup/domain';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { fmt } from '@/lib/format';
import { useDay } from '@/state/useDay';
import { Bar, Card, Circ, Lbl, Num, Pill, Row, Screen, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const ICON: Record<Achievement['icon'], IconName> = { check: 'check', streak: 'streak', steps: 'steps', sun: 'sun', water: 'water', crown: 'crown' };

/** Уровень и достижения из макета. */
export default function Level() {
  const t = useTheme();
  const d = useDay();
  if (!d) return null;
  const g = d.game;
  const colors: Record<Achievement['id'], string> = { first: t.food, streak7: t.xp, steps10k: t.steps, early: t.xp, water8: t.food, month: t.coin };
  const doneCount = g.achievements.filter((a) => a.done).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 16 }}>
        <Row style={{ justifyContent: 'space-between', height: 56, paddingHorizontal: 4 }}>
          <Circ icon="chevronLeft" label="Назад" onPress={() => router.back()} />
          <Pill label="Монеты">
            <Icon name="coin" size={16} color={t.coin} />
            <Lbl color={t.tx}>{fmt(g.coins)}</Lbl>
          </Pill>
        </Row>

        <View style={{ paddingHorizontal: 4, gap: 6, marginTop: 8 }}>
          <Lbl>Уровень</Lbl>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Num size={88}>{String(g.level).padStart(2, '0')}</Num>
            <Txt muted style={{ marginBottom: 18 }}>
              до {g.level + 1}-го — {XP_PER_LEVEL - g.levelXp} XP
            </Txt>
          </Row>
          <Bar value={g.levelXp / XP_PER_LEVEL} color={t.xp} style={{ marginTop: 10 }} />
        </View>

        <Lbl style={{ paddingHorizontal: 4, marginTop: 28 }}>
          Достижения · {doneCount} из {g.achievements.length}
        </Lbl>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {g.achievements.map((a) => (
            <Card key={a.id} style={{ width: '47%', flexGrow: 1, height: 112, padding: 16, justifyContent: 'space-between', opacity: a.done || a.progress > 0 ? 1 : 0.6 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: a.done ? colors[a.id] : t.sf2 }}>
                  <Icon name={ICON[a.icon]} size={20} color={a.done ? '#FFFFFF' : t.mu} />
                </View>
                <Lbl>{a.done ? 'есть' : `${a.progress}/${a.target}`}</Lbl>
              </Row>
              <Txt size={16} muted={!a.done}>
                {a.title}
              </Txt>
            </Card>
          ))}
        </View>
        <Txt size={13} muted style={{ paddingHorizontal: 4, marginTop: 8 }}>
          +25 XP за запись еды (до 8 в день) и тренировку, +50 — за цель по шагам, +100 — за достижение. 1000 XP — новый уровень.
        </Txt>
      </ScrollView>
    </Screen>
  );
}

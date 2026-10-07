import { Pressable, View } from 'react-native';
import { QUEST_COINS, QUEST_XP, QuestStatus } from '@levelup/domain';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';
import { fmt } from '@/lib/format';
import { Bar, Card, Row, T } from './ui';

const ICONS: Record<string, string> = {
  meal: '🍽', steps: '👟', water: '💧', sleep: '🌙', workout: '💪', veg: '🥦', protein: '🥩', clock: '⏰', nosweet: '🍬',
};

export function QuestList({ quests, compact }: { quests: QuestStatus[]; compact?: boolean }) {
  const { c } = useTheme();
  const toggle = useStore((s) => s.toggleManualQuest);
  return (
    <View style={{ gap: 8 }}>
      {quests.map(({ quest, progress, target, done }) => (
        <Pressable
          key={quest.id}
          disabled={!quest.manual}
          onPress={() => toggle(quest.id)}
          accessibilityRole={quest.manual ? 'checkbox' : undefined}
          accessibilityState={{ checked: done }}
        >
          <Card style={{ padding: compact ? 12 : 16, borderColor: done ? c.success : c.border }}>
            <Row gap={12}>
              <T size="lg">{done ? '✅' : ICONS[quest.icon] ?? '⭐'}</T>
              <View style={{ flex: 1, gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T bold style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }}>
                    {quest.title}
                  </T>
                  <T size="xs" tone="xp" bold>
                    +{QUEST_XP} XP
                  </T>
                </Row>
                {quest.manual ? (
                  <T size="xs" tone="muted">
                    {done ? 'Готово! Нажми, чтобы снять отметку' : 'Нажми, когда сделаешь'}
                  </T>
                ) : target > 1 ? (
                  <Row>
                    <Bar value={progress} max={target} color={done ? c.success : c.primary} style={{ flex: 1 }} />
                    <T size="xs" tone="muted">
                      {fmt(progress)} / {fmt(target)}
                      {quest.unit ? ` ${quest.unit}` : ''}
                    </T>
                  </Row>
                ) : null}
                {!compact && (
                  <T size="xs" tone="coin">
                    +{QUEST_COINS} монет
                  </T>
                )}
              </View>
            </Row>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

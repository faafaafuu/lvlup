import { View } from 'react-native';
import { QUEST_XP, QuestStatus } from '@levelup/domain';
import { QuestCard } from '@/design/components';
import { IconName } from '@/design/icons';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';
import { T } from './ui';

const ICONS: Record<string, IconName> = {
  meal: 'plate', steps: 'steps', water: 'water', sleep: 'sleep', workout: 'workout', veg: 'star', protein: 'workout', clock: 'timer', nosweet: 'freeze',
};

export function QuestList({ quests, hint }: { quests: QuestStatus[]; hint?: boolean }) {
  const t = useTheme();
  const toggle = useStore((s) => s.toggleManualQuest);
  return (
    <View style={{ gap: 8 }}>
      {quests.map(({ quest, progress, target }) => (
        <View key={quest.id} style={{ gap: 4 }}>
          <QuestCard
            t={t}
            icon={ICONS[quest.icon] ?? 'quest'}
            title={quest.title}
            current={progress}
            target={target}
            unit={quest.unit ? ` ${quest.unit}` : ''}
            xp={QUEST_XP}
            onPress={quest.manual ? () => toggle(quest.id) : undefined}
            disabled={false}
          />
          {hint && quest.manual && (
            <T size="xs" tone="muted" style={{ marginLeft: 12 }}>
              {progress >= target ? 'Нажми ещё раз, чтобы снять отметку' : 'Нажми на карточку, когда сделаешь'}
            </T>
          )}
        </View>
      ))}
    </View>
  );
}

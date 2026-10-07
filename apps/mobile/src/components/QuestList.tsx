import { View } from 'react-native';
import { QUEST_XP, QuestStatus } from '@levelup/domain';
import { QuestCard } from '@/design/components';
import { IconName } from '@/design/icons';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

const ICONS: Record<string, IconName> = {
  meal: 'plate', steps: 'steps', water: 'water', sleep: 'sleep', workout: 'workout', veg: 'star', protein: 'workout', clock: 'timer', nosweet: 'freeze',
};

export function QuestList({ quests }: { quests: QuestStatus[] }) {
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
            manual={quest.manual}
            onPress={quest.manual ? () => toggle(quest.id) : undefined}
          />
        </View>
      ))}
    </View>
  );
}

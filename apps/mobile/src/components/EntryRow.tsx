import { ReactNode, useRef } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { tap } from '@/lib/haptics';
import { Lbl } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

/**
 * Строка записи: тап — карточка, смахнуть влево — «Изменить» и «Удалить».
 * Удаление без вопроса: внизу появляется «Вернуть».
 */
export function EntryRow({ children, onOpen, onDelete, bg }: { children: ReactNode; onOpen: () => void; onDelete: () => void; bg?: string }) {
  const t = useTheme();
  const ref = useRef<SwipeableMethods>(null);
  const action = (icon: IconName, label: string, color: string, run: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        ref.current?.close();
        run();
      }}
      style={({ pressed }) => ({ width: 84, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: color, opacity: pressed ? 0.8 : 1 })}
    >
      <Icon name={icon} size={20} color="#FFFFFF" />
      <Lbl color="#FFFFFF" style={{ fontSize: 10 }}>
        {label}
      </Lbl>
    </Pressable>
  );
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      rightThreshold={40}
      overshootRight={false}
      // Вправо строку не тянем — этот жест остаётся листанию разделов.
      dragOffsetFromLeftEdge={10000}
      onSwipeableWillOpen={() => tap()}
      renderRightActions={() => (
        <View style={{ flexDirection: 'row' }}>
          {action('edit', 'Изменить', t.steps, onOpen)}
          {action('trash', 'Удалить', t.xp, onDelete)}
        </View>
      )}
    >
      <Pressable
        onPress={() => {
          tap();
          onOpen();
        }}
        style={({ pressed }) => ({ backgroundColor: bg ?? t.sf, opacity: pressed ? 0.6 : 1 })}
      >
        {children}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '@/lib/haptics';
import { useStore } from '@/state/store';
import { Lbl, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

const SHOW_MS = 5000;

/** «Удалено · Вернуть» — вместо вопроса «точно удалить?»: удалять быстро, ошибиться не страшно. */
export function UndoToast() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const undo = useStore((s) => s.undo);
  const clear = useStore((s) => s.clearUndo);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(clear, SHOW_MS);
    return () => clearTimeout(id);
  }, [undo, clear]);

  if (!undo) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 104 }}
    >
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 6, height: 52, borderRadius: 26,
          backgroundColor: t.sf2, borderWidth: 1, borderColor: t.ln,
        }}
      >
        <Txt size={15} numberOfLines={1} style={{ flex: 1 }}>
          Удалено: {undo.label}
        </Txt>
        <Pressable
          onPress={() => {
            tap();
            undo.restore();
          }}
          style={({ pressed }) => ({ height: 40, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center', backgroundColor: pressed ? t.ln : 'transparent' })}
        >
          <Lbl color={t.tx} style={{ fontSize: 12 }}>
            Вернуть
          </Lbl>
        </Pressable>
      </View>
    </Animated.View>
  );
}

import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { useTheme } from '@/theme';
import { T } from './ui';

export function MicButton({ listening, onPress }: { listening: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!listening) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={listening ? 'Остановить запись' : 'Записать еду голосом'} onPress={onPress}>
      <Animated.View
        style={{
          position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
        }}
      />
      <Animated.View
        style={{
          width: 80, height: 80, borderRadius: 40, backgroundColor: listening ? c.danger : c.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: c.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
        }}
      >
        <T size="xl" style={{ color: c.onPrimary }}>
          {listening ? '■' : '🎙'}
        </T>
      </Animated.View>
    </Pressable>
  );
}

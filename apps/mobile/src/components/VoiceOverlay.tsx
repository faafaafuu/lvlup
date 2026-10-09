import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { Btn, T, textInputStyle } from './ui';

const EXAMPLES = ['тарелка борща и два куска хлеба', '200 грамм гречки и котлета', 'час в зале с гантелями', '2 стакана колы без сахара'];

export type OverlayMode = 'listening' | 'parsing' | 'text' | 'error';

interface Props {
  mode: OverlayMode | null;
  /** 0..1 — громкость для волны. */
  level: number;
  heardSomething: boolean;
  phrase: string;
  error: string | null;
  onStop: () => void;
  onCancel: () => void;
  onSubmitText: (text: string) => void;
  onSwitchToText: () => void;
}

export function VoiceOverlay({ mode, level, heardSomething, phrase, error, onStop, onCancel, onSubmitText, onSwitchToText }: Props) {
  const { c } = useTheme();
  const [text, setText] = useState('');
  if (!mode) return null;
  const example = EXAMPLES[new Date().getMinutes() % EXAMPLES.length];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={mode === 'listening' ? undefined : onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.scrim, justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: c.bg, borderRadius: 28, padding: 24, gap: 18, alignItems: 'center' }}>
          {mode === 'listening' && (
            <>
              <Wave level={level} color={c.primary === '#111113' ? c.text : c.primary} />
              <T size="lg" bold display style={{ textAlign: 'center' }}>
                {heardSomething ? 'Слушаю, продолжай…' : 'Говори, я слушаю'}
              </T>
              <T tone="muted" size="sm" style={{ textAlign: 'center' }}>
                Не торопись — закончу сам после паузы.{'\n'}Например: «{example}»
              </T>
              <Btn title="Готово" onPress={onStop} style={{ alignSelf: 'stretch' }} />
              <Pressable onPress={onCancel} hitSlop={12}>
                <T tone="muted">Отмена</T>
              </Pressable>
            </>
          )}
          {mode === 'parsing' && (
            <>
              <ActivityIndicator color={c.text} size="large" />
              <T tone="muted" style={{ textAlign: 'center' }} numberOfLines={3}>
                Разбираю «{phrase}»
              </T>
            </>
          )}
          {mode === 'error' && (
            <>
              <T size="lg" bold style={{ textAlign: 'center' }}>
                {error ?? 'Не расслышал, попробуй ещё раз'}
              </T>
              <Btn title="Ввести текстом" onPress={onSwitchToText} style={{ alignSelf: 'stretch' }} />
              <Btn title="Закрыть" kind="ghost" onPress={onCancel} style={{ alignSelf: 'stretch' }} />
            </>
          )}
          {mode === 'text' && (
            <View style={{ gap: 12, alignSelf: 'stretch' }}>
              <T size="lg" bold display>
                Что съел или как тренировался?
              </T>
              <TextInput
                autoFocus
                value={text}
                onChangeText={setText}
                placeholder={example}
                placeholderTextColor={c.textMuted}
                style={textInputStyle(c)}
                returnKeyType="done"
                onSubmitEditing={() => text.trim() && onSubmitText(text.trim())}
              />
              <Btn
                title="Разобрать"
                disabled={!text.trim()}
                onPress={() => {
                  onSubmitText(text.trim());
                  setText('');
                }}
              />
              <Btn title="Отмена" kind="ghost" onPress={onCancel} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Пять столбиков, которые прыгают от громкости голоса — видно, что запись идёт. */
function Wave({ level, color }: { level: number; color: string }) {
  const bars = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0.2))).current;
  const shape = [0.55, 0.8, 1, 0.8, 0.55];
  useEffect(() => {
    bars.forEach((b, i) => {
      const jitter = 0.75 + Math.random() * 0.5;
      Animated.spring(b, { toValue: Math.max(0.18, Math.min(1, level * shape[i]! * jitter * 1.6)), useNativeDriver: true, speed: 30, bounciness: 4 }).start();
    });
  }, [level, bars]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 72 }}>
      {bars.map((b, i) => (
        <Animated.View key={i} style={{ width: 10, height: 72, borderRadius: 5, backgroundColor: color, transform: [{ scaleY: b }] }} />
      ))}
    </View>
  );
}

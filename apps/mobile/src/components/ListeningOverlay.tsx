import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { Circ, Cta, Ghost, Lbl, Txt } from '@/ui/kit';
import { useTheme } from '@/ui/theme';

export type OverlayMode = 'listening' | 'parsing' | 'text' | 'error';

const EXAMPLES = ['тарелка борща и два куска хлеба', '200 грамм гречки и котлета', 'час в зале с гантелями', '2 стакана колы без сахара'];

interface Props {
  mode: OverlayMode | null;
  level: number;
  heardSomething: boolean;
  phrase: string;
  error: string | null;
  onStop: () => void;
  onCancel: () => void;
  onSubmitText: (text: string) => void;
  onSwitchToText: () => void;
}

/**
 * Экран «Слушаю» из макета: всё приглушено, внизу ✕ · стоп в кольце-волне · клавиатура.
 * Расшифровку не показываем — только волна от громкости голоса.
 */
export function ListeningOverlay({ mode, level, heardSomething, phrase, error, onStop, onCancel, onSubmitText, onSwitchToText }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  if (!mode) return null;
  const example = EXAMPLES[new Date().getMinutes() % EXAMPLES.length];
  const bottom = Math.max(insets.bottom, 12) + 6;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={mode === 'listening' ? undefined : onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.light ? 'rgba(10,20,60,0.45)' : 'rgba(0,0,0,0.62)' }}>
        {(mode === 'listening' || mode === 'parsing') && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ alignItems: 'center', gap: 8, marginBottom: 28, paddingHorizontal: 32 }}>
              <Lbl color="#FFFFFF">{mode === 'parsing' ? 'Разбираю' : heardSomething ? 'Слушаю · продолжай' : 'Говори, я слушаю'}</Lbl>
              <Txt size={15} color="rgba(255,255,255,0.7)" style={{ textAlign: 'center' }} numberOfLines={2}>
                {mode === 'parsing' ? `«${phrase}»` : `Закончу сам после паузы. Например: «${example}»`}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44, marginBottom: bottom - 37 }}>
              <Circ icon="close" label="Отмена" size={50} onPress={onCancel} />
              <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
                {mode === 'listening' ? <Wave level={level} /> : <ActivityIndicator color="#FFFFFF" />}
                {mode === 'listening' && (
                  <Pressable
                    accessibilityLabel="Готово"
                    onPress={onStop}
                    style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#1A1A1F', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                  </Pressable>
                )}
              </View>
              <Circ icon="keyboard" label="Ввести текстом" size={50} onPress={onSwitchToText} />
            </View>
          </View>
        )}

        {mode === 'error' && (
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: bottom + 8, gap: 12 }}>
            <Txt size={22} weight="300" color="#FFFFFF" style={{ textAlign: 'center', marginBottom: 12 }}>
              {error ?? 'Не расслышал, попробуй ещё раз'}
            </Txt>
            <Cta title="Ввести текстом" onPress={onSwitchToText} />
            <Ghost title="Закрыть" onPress={onCancel} />
          </View>
        )}

        {mode === 'text' && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: bottom + 8, gap: 14 }}>
              <Lbl>Что съел или как тренировался</Lbl>
              <TextInput
                autoFocus
                value={text}
                onChangeText={setText}
                placeholder={example}
                placeholderTextColor={t.mu}
                returnKeyType="done"
                onSubmitEditing={() => text.trim() && onSubmitText(text.trim())}
                style={{ color: t.tx, fontSize: 20, minHeight: 56, borderBottomWidth: 0.5, borderBottomColor: t.ln }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Ghost title="Отмена" onPress={onCancel} />
                <Cta
                  title="Разобрать"
                  style={{ flex: 1 }}
                  disabled={!text.trim()}
                  onPress={() => {
                    onSubmitText(text.trim());
                    setText('');
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const BARS = 56;

/** Круговая волна: штрихи вокруг кнопки стоп тянутся от громкости, цвет — синий → фиолетовый → розовый. */
function Wave({ level }: { level: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [lv, setLv] = useState(0);
  useEffect(() => {
    Animated.timing(anim, { toValue: level, duration: 80, useNativeDriver: false }).start();
    const id = anim.addListener(({ value }) => setLv(value));
    return () => anim.removeListener(id);
  }, [level, anim]);
  const seeds = useMemo(() => Array.from({ length: BARS }, () => 0.5 + Math.random() * 0.5), []);
  const color = (i: number) => {
    const k = i / BARS;
    const stops = [[79, 123, 255], [155, 91, 240], [232, 64, 138], [79, 123, 255]] as const;
    const seg = Math.min(2, Math.floor(k * 3));
    const f = k * 3 - seg;
    const a = stops[seg]!;
    const b = stops[seg + 1]!;
    return `rgb(${a.map((v, j) => Math.round(v + (b[j]! - v) * f)).join(',')})`;
  };
  return (
    <Svg width={150} height={150} style={{ position: 'absolute' }}>
      {seeds.map((s, i) => {
        const ang = (i / BARS) * Math.PI * 2 - Math.PI / 2;
        const r0 = 38;
        const len = 6 + (lv * 30 + 4) * s;
        return (
          <Line
            key={i}
            x1={75 + Math.cos(ang) * r0}
            y1={75 + Math.sin(ang) * r0}
            x2={75 + Math.cos(ang) * (r0 + len)}
            y2={75 + Math.sin(ang) * (r0 + len)}
            stroke={color(i)}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

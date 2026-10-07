import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { Btn, T, textInputStyle } from './ui';

const EXAMPLES = ['тарелка борща и два куска хлеба', '200 грамм гречки и котлета', 'капучино и круассан'];

export type OverlayMode = 'listening' | 'parsing' | 'text' | 'error';

interface Props {
  mode: OverlayMode | null;
  transcript: string;
  error: string | null;
  onStop: () => void;
  onCancel: () => void;
  onSubmitText: (text: string) => void;
  onSwitchToText: () => void;
}

export function VoiceOverlay({ mode, transcript, error, onStop, onCancel, onSubmitText, onSwitchToText }: Props) {
  const { c } = useTheme();
  const [text, setText] = useState('');
  if (!mode) return null;
  const example = EXAMPLES[new Date().getMinutes() % EXAMPLES.length];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#000C', justifyContent: 'center', padding: 24 }}>
        {mode === 'listening' && (
          <View style={{ gap: 24, alignItems: 'center' }}>
            <T tone="muted">Слушаю…</T>
            <T size="xl" bold style={{ color: '#fff', textAlign: 'center', minHeight: 80 }}>
              {transcript || `«${example}»`}
            </T>
            <Btn title="Готово" onPress={onStop} style={{ alignSelf: 'stretch' }} />
            <Pressable onPress={onCancel} hitSlop={10}>
              <T style={{ color: '#fff9' }}>Отмена</T>
            </Pressable>
          </View>
        )}
        {mode === 'parsing' && (
          <View style={{ gap: 16, alignItems: 'center' }}>
            <ActivityIndicator color="#fff" size="large" />
            <T style={{ color: '#fff' }}>Разбираю «{transcript}»</T>
          </View>
        )}
        {mode === 'error' && (
          <View style={{ gap: 16 }}>
            <T size="lg" bold style={{ color: '#fff', textAlign: 'center' }}>
              {error ?? 'Не расслышал, попробуй ещё раз'}
            </T>
            <Btn title="Ввести текстом" onPress={onSwitchToText} />
            <Btn title="Закрыть" kind="ghost" onPress={onCancel} />
          </View>
        )}
        {mode === 'text' && (
          <View style={{ gap: 12, backgroundColor: c.bg, padding: 20, borderRadius: 20 }}>
            <T size="lg" bold>
              Что съел?
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
            <T size="xs" tone="muted">
              Можно надиктовать кнопкой 🎙 на клавиатуре iPhone.
            </T>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

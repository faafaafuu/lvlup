import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { T } from '@/components/ui';
import { useStore } from '@/state/store';
import { useMealCapture } from '@/state/useMealCapture';
import { useTheme } from '@/theme';

/**
 * Вход из Siri / Быстрых команд: levelup://log?text=тарелка%20плова
 * Если фраза понятна без вопросов — записываем сразу и возвращаемся на главный экран.
 * Если есть уточнения или незнакомые слова — показываем обычное подтверждение.
 */
export default function LogFromLink() {
  const { c } = useTheme();
  const { text } = useLocalSearchParams<{ text?: string }>();
  const capture = useMealCapture();
  const [status, setStatus] = useState('Разбираю…');
  const started = useRef(false);

  useEffect(() => {
    const phrase = (Array.isArray(text) ? text[0] : text)?.trim();
    if (started.current) return;
    started.current = true;
    if (!phrase) {
      router.replace('/');
      return;
    }
    void (async () => {
      const draft = await capture.parse(phrase);
      if (!draft) return router.replace('/');
      const clear = draft.questions.length === 0 && draft.unknown.length === 0 && (draft.items.length > 0 || draft.activities.length > 0);
      if (clear) {
        useStore.getState().addEntry(draft);
        capture.cancel();
        router.replace('/');
      } else if (draft.items.length === 0 && draft.activities.length === 0) {
        setStatus(`Не понял «${phrase}»`);
        setTimeout(() => router.replace('/'), 1800);
      }
    })();
  }, [text, capture]);

  const close = () => router.replace('/');

  return (
    <View style={{ flex: 1, backgroundColor: c.scrim, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {!capture.draft && (
        <>
          <ActivityIndicator color="#fff" />
          <T style={{ color: '#fff' }}>{status}</T>
        </>
      )}
      <ConfirmSheet
        draft={capture.draft}
        source={capture.source}
        onChange={capture.setDraft}
        onConfirm={() => {
          capture.confirm();
          close();
        }}
        onCancel={() => {
          capture.cancel();
          close();
        }}
      />
    </View>
  );
}

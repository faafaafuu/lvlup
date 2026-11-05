import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { MealDraft, currentWeight, dateKey } from '@levelup/domain';
import { SITE, parsePhrase } from '@/lib/parse';
import { newId } from '@/lib/id';
import { useStore } from './store';

/** Общий поток «фраза → черновик → подтверждение → запись» для главного экрана и дневника. */
export function useMealCapture() {
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [source, setSource] = useState<'server' | 'offline'>('offline');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [offlineReason, setOfflineReason] = useState<string | null>(null);

  const parse = useCallback(async (text: string, fromPendingId?: string) => {
    if (useStore.getState().settings.ai === undefined) {
      const ai = await askAiConsent();
      useStore.getState().updateSettings({ ai, deviceId: useStore.getState().settings.deviceId ?? newId() });
    }
    const { settings, portions, addPending, profile, weights } = useStore.getState();
    const kg = profile ? currentWeight(profile, weights) : 75;
    const result = await parsePhrase(text, settings, portions, kg);
    const empty = result.draft.items.length === 0 && result.draft.activities.length === 0;
    if (empty && result.serverFailed && !fromPendingId) {
      addPending(text);
      Alert.alert('Сохранил фразу', 'Сервер не ответил, а офлайн не понял. Разберу, когда появится связь — фраза внизу экрана «День».');
      return null;
    }
    setSource(result.source);
    setOfflineReason(result.reason ?? null);
    setPendingId(fromPendingId ?? null);
    setDraft(result.draft);
    return result.draft;
  }, []);

  const confirm = useCallback(() => {
    if (!draft) return;
    const { addEntry, removePending, viewDate } = useStore.getState();
    addEntry(draft, atFor(viewDate));
    if (pendingId) removePending(pendingId);
    setDraft(null);
    setPendingId(null);
  }, [draft, pendingId]);

  const cancel = useCallback(() => {
    setDraft(null);
    setPendingId(null);
  }, []);

  return { draft, source, offlineReason, setDraft, parse, confirm, cancel };
}

/**
 * Перед первой отправкой фразы — явное согласие (App Store, 5.1.2): что уходит, кому и
 * что можно отказаться. Отказ — разбор на телефоне; меняется в «Настройки → Распознавание с ИИ».
 */
function askAiConsent(): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      'Распознавание с ИИ',
      'Чтобы понимать живую речь, Хрум отправляет текст фразы о еде на свой сервер и языковой модели DeepSeek (через OpenRouter). Голос, имя и данные Здоровья не передаются.\n\nБез этого фразы разбираются на телефоне, но хуже.',
      [
        { text: 'Подробнее', onPress: () => { void Linking.openURL(`${SITE}/privacy`); resolve(false); } },
        { text: 'Только на телефоне', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Разрешить', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    ),
  );
}

/** Время записи: сейчас — для сегодня; для прошлого дня — тот же час, но в выбранную дату. */
export function atFor(day: string): string {
  const now = new Date();
  if (day === dateKey(now)) return now.toISOString();
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes()).toISOString();
}

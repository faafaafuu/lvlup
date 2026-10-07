import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { MealDraft } from '@levelup/domain';
import { parsePhrase } from '@/lib/parse';
import { useStore } from './store';

/** Общий поток «фраза → черновик → подтверждение → запись» для главного экрана и дневника. */
export function useMealCapture() {
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [source, setSource] = useState<'server' | 'offline'>('offline');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const parse = useCallback(async (text: string, fromPendingId?: string) => {
    const { settings, portions, addPending } = useStore.getState();
    const result = await parsePhrase(text, settings, portions);
    if (result.draft.items.length === 0 && result.serverFailed && !fromPendingId) {
      addPending(text);
      Alert.alert('Сохранил фразу', 'Сервер не ответил, а офлайн не понял. Разберу, когда появится связь — фраза в Дневнике.');
      return false;
    }
    setSource(result.source);
    setPendingId(fromPendingId ?? null);
    setDraft(result.draft);
    return true;
  }, []);

  const confirm = useCallback(() => {
    if (!draft) return;
    const { addMeal, removePending } = useStore.getState();
    addMeal(draft);
    if (pendingId) removePending(pendingId);
    setDraft(null);
    setPendingId(null);
  }, [draft, pendingId]);

  const cancel = useCallback(() => {
    setDraft(null);
    setPendingId(null);
  }, []);

  return { draft, source, setDraft, parse, confirm, cancel };
}

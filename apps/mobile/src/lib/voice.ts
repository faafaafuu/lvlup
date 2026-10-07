import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Нативное распознавание речи есть только в dev/release-сборке. В Expo Go модуля нет —
 * тогда приложение предлагает текстовый ввод (а на iPhone в клавиатуре есть кнопка диктовки).
 */
type SpeechModule = typeof import('expo-speech-recognition');
let speech: SpeechModule | null = null;
try {
  speech = require('expo-speech-recognition') as SpeechModule;
} catch {
  speech = null;
}

export const voiceSupported = speech != null;

export type VoiceState = 'idle' | 'listening' | 'error';

const ERRORS: Record<string, string> = {
  'no-speech': 'Не расслышал, попробуй ещё раз',
  'speech-timeout': 'Не расслышал, попробуй ещё раз',
  'not-allowed': 'Нет доступа к микрофону или распознаванию — включи в Настройках iPhone → Level Up',
  'audio-capture': 'Микрофон занят другим приложением',
  interrupted: 'Запись прервалась (звонок или Siri) — попробуй ещё раз',
  network: 'Нет связи с сервером распознавания Apple — попробуй ещё раз',
  'language-not-supported': 'Русский язык распознавания недоступен на этом iPhone',
  'service-not-allowed': 'Распознавание речи выключено — Настройки → Siri → включи Siri или диктовку',
};

export function useVoice(onFinal: (text: string) => void) {
  const [state, setStateRaw] = useState<VoiceState>('idle');
  // Дублируем состояние в ref: обработчики нативных событий не должны зависеть от замыканий.
  const stateRef = useRef<VoiceState>('idle');
  const setState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setStateRaw(s);
  }, []);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const latest = useRef('');
  const finalCb = useRef(onFinal);
  finalCb.current = onFinal;

  useEffect(() => {
    if (!speech) return;
    const m = speech.ExpoSpeechRecognitionModule;
    const subs = [
      m.addListener('result', (e) => {
        const text = e.results[0]?.transcript ?? '';
        latest.current = text;
        setTranscript(text);
      }),
      m.addListener('error', (e) => {
        // «aborted» шлёт сам модуль в ответ на наш abort() — это отмена, а не ошибка.
        // Раньше она снова открывала экран ошибки, его «Закрыть» звал abort() — и по кругу.
        if (e.error === 'aborted') {
          setState('idle');
          return;
        }
        if (stateRef.current !== 'listening') return;
        setError(ERRORS[e.error] ?? 'Не получилось распознать, попробуй ещё раз или введи текстом');
        setState('error');
      }),
      m.addListener('end', () => {
        if (stateRef.current === 'error') return;
        const wasListening = stateRef.current === 'listening';
        setState('idle');
        if (wasListening && latest.current.trim()) finalCb.current(latest.current.trim());
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [setState]);

  const start = useCallback(async () => {
    if (!speech) return false;
    const m = speech.ExpoSpeechRecognitionModule;
    const perm = await m.requestPermissionsAsync();
    if (!perm.granted) {
      setError('Нет доступа к микрофону — включи в Настройках iPhone');
      setState('error');
      return false;
    }
    latest.current = '';
    setTranscript('');
    setError(null);
    setState('listening');
    m.start({ lang: 'ru-RU', interimResults: true, continuous: false, addsPunctuation: false });
    return true;
  }, [setState]);

  const stop = useCallback(() => speech?.ExpoSpeechRecognitionModule.stop(), []);
  const cancel = useCallback(() => {
    latest.current = '';
    const wasListening = stateRef.current === 'listening';
    setState('idle');
    if (wasListening) speech?.ExpoSpeechRecognitionModule.abort();
  }, [setState]);
  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setTranscript('');
  }, [setState]);

  return { state, transcript, error, start, stop, cancel, reset };
}

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

/** Сколько ждать первых слов — человек может вспоминать, что ел. */
const WAIT_FOR_SPEECH_MS = 12_000;
/** Пауза после слов, после которой считаем фразу законченной. */
const SILENCE_AFTER_SPEECH_MS = 4_000;

const ERRORS: Record<string, string> = {
  'no-speech': 'Не расслышал, попробуй ещё раз',
  'speech-timeout': 'Не расслышал, попробуй ещё раз',
  'not-allowed': 'Нет доступа к микрофону или распознаванию — включи в Настройках iPhone → Хрум',
  'audio-capture': 'Микрофон занят другим приложением',
  interrupted: 'Запись прервалась (звонок или Siri) — попробуй ещё раз',
  network: 'Нет связи с сервером распознавания Apple — попробуй ещё раз',
  'language-not-supported': 'Русский язык распознавания недоступен на этом iPhone',
  'service-not-allowed': 'Распознавание речи выключено — Настройки → Siri → включи Siri или диктовку',
};

/**
 * Непрерывная запись: не обрывается на первой паузе, а заканчивается сама после
 * SILENCE_AFTER_SPEECH_MS тишины (или по кнопке «Готово»). Текст на экран не выводим —
 * только уровень громкости для анимации, чтобы не отвлекать «печатанием».
 */
export function useVoice(onFinal: (text: string) => void) {
  const [state, setStateRaw] = useState<VoiceState>('idle');
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [heardSomething, setHeardSomething] = useState(false);
  const stateRef = useRef<VoiceState>('idle');
  const committed = useRef('');
  const current = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalCb = useRef(onFinal);
  finalCb.current = onFinal;

  const setState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setStateRaw(s);
  }, []);

  const text = () => `${committed.current} ${current.current}`.replace(/\s+/g, ' ').trim();

  const armTimer = useCallback((ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => speech?.ExpoSpeechRecognitionModule.stop(), ms);
  }, []);

  useEffect(() => {
    if (!speech) return;
    const m = speech.ExpoSpeechRecognitionModule;
    const subs = [
      m.addListener('result', (e) => {
        const t = e.results[0]?.transcript ?? '';
        if (e.isFinal) {
          committed.current = `${committed.current} ${t}`;
          current.current = '';
        } else {
          current.current = t;
        }
        if (text()) {
          setHeardSomething(true);
          armTimer(SILENCE_AFTER_SPEECH_MS);
        }
      }),
      m.addListener('volumechange', (e) => setLevel(Math.max(0, Math.min(1, e.value / 10)))),
      m.addListener('error', (e) => {
        // «aborted» — ответ модуля на наш abort(), это отмена, а не ошибка.
        if (e.error === 'aborted') {
          setState('idle');
          return;
        }
        if (stateRef.current !== 'listening') return;
        if (e.error === 'no-speech' && text()) return; // уже что-то сказал — дождёмся end
        setError(ERRORS[e.error] ?? 'Не получилось распознать, попробуй ещё раз или введи текстом');
        setState('error');
      }),
      m.addListener('end', () => {
        if (timer.current) clearTimeout(timer.current);
        setLevel(0);
        if (stateRef.current === 'error') return;
        const wasListening = stateRef.current === 'listening';
        setState('idle');
        const phrase = text();
        if (wasListening && phrase) finalCb.current(phrase);
      }),
    ];
    return () => {
      subs.forEach((s) => s.remove());
      if (timer.current) clearTimeout(timer.current);
    };
  }, [setState, armTimer]);

  const start = useCallback(async () => {
    if (!speech) return false;
    const m = speech.ExpoSpeechRecognitionModule;
    const perm = await m.requestPermissionsAsync();
    if (!perm.granted) {
      setError(ERRORS['not-allowed']!);
      setState('error');
      return false;
    }
    committed.current = '';
    current.current = '';
    setHeardSomething(false);
    setError(null);
    setState('listening');
    m.start({
      lang: 'ru-RU',
      interimResults: true,
      continuous: true,
      addsPunctuation: false,
      volumeChangeEventOptions: { enabled: true, intervalMillis: 80 },
    });
    armTimer(WAIT_FOR_SPEECH_MS);
    return true;
  }, [setState, armTimer]);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    speech?.ExpoSpeechRecognitionModule.stop();
  }, []);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    committed.current = '';
    current.current = '';
    const wasListening = stateRef.current === 'listening';
    setState('idle');
    if (wasListening) speech?.ExpoSpeechRecognitionModule.abort();
  }, [setState]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, [setState]);

  return { state, level, heardSomething, error, start, stop, cancel, reset };
}

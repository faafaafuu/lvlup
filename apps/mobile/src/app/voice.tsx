import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { router } from 'expo-router';
import { useCapture } from '@/components/CaptureHost';

/**
 * levelup://voice — кнопка в виджете, островке и на экране блокировки: уходим на главный и слушаем.
 * С экрана блокировки ссылка приходит, пока телефон ещё разблокируется: если сразу включить
 * микрофон, iOS обрывает запись («прервалась»). Поэтому ждём, пока приложение станет активным.
 */
export default function VoiceFromLink() {
  const capture = useCapture();
  useEffect(() => {
    router.replace('/');
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      // CaptureHost живёт над стеком, поэтому таймер переживает размонтирование этого экрана.
      setTimeout(() => {
        if (!capture.recording) capture.toggleVoice();
      }, 500);
    };
    if (AppState.currentState === 'active') go();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && go());
    const bail = setTimeout(() => sub.remove(), 15_000);
    return () => {
      // Экран размонтируется сразу после replace — подписку держим до активации.
      setTimeout(() => sub.remove(), done ? 0 : 15_000);
      clearTimeout(bail);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <View />;
}

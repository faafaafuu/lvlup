import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useCapture } from '@/components/CaptureHost';

/** levelup://voice — кнопка микрофона в виджете и островке: уходим на главный и сразу слушаем. */
export default function VoiceFromLink() {
  const capture = useCapture();
  useEffect(() => {
    router.replace('/');
    // CaptureHost живёт над стеком, поэтому таймер переживает размонтирование этого экрана.
    setTimeout(() => {
      if (!capture.recording) capture.toggleVoice();
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <View />;
}

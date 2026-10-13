import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Cta, Lbl, Txt } from '@/ui/kit';
import { checkServer } from '@/lib/parse';
import { useStore } from '@/state/store';
import { useTheme } from '@/ui/theme';

/**
 * Подключение к серверу разбора одной ссылкой: levelup://connect?url=…&token=…
 * Открываешь её на телефоне (из заметок или Telegram) — адрес и токен сохраняются сами.
 */
export default function Connect() {
  const t = useTheme();
  const { url, token } = useLocalSearchParams<{ url?: string; token?: string }>();
  const [status, setStatus] = useState('Подключаюсь к серверу…');
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const apiUrl = (Array.isArray(url) ? url[0] : url)?.trim();
    const apiToken = (Array.isArray(token) ? token[0] : token)?.trim();
    if (!apiUrl || !apiToken) {
      setStatus('В ссылке нет адреса или токена');
      setDone(true);
      return;
    }
    useStore.getState().updateSettings({ apiUrl, apiToken });
    void checkServer({ ...useStore.getState().settings, apiUrl, apiToken }).then((r) => {
      setStatus(r.startsWith('Работает') ? `Готово! ${r}` : r);
      setDone(true);
    });
  }, [url, token]);

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: t.bg, borderRadius: 20, padding: 20, gap: 14, alignSelf: 'stretch' }}>
        <Lbl>Сервер распознавания</Lbl>
        {!done && <ActivityIndicator color={t.tx} />}
        <Txt>{status}</Txt>
        {done && <Cta title="Готово" onPress={() => router.replace('/')} />}
      </View>
    </View>
  );
}

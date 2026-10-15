import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setRecording } from '@/lib/live';
import { useVoice, voiceSupported } from '@/lib/voice';
import { useMealCapture } from '@/state/useMealCapture';
import { ConfirmSheet } from './ConfirmSheet';
import { ListeningOverlay, OverlayMode } from './ListeningOverlay';

interface CaptureApi {
  /** Микрофон: старт/стоп записи (или текстовый ввод, если голоса нет в сборке). */
  toggleVoice(): void;
  openText(): void;
  /** Разобрать отложенную фразу (из очереди «ждут интернета»). */
  parsePending(text: string, id: string): Promise<void>;
  recording: boolean;
}

const Ctx = createContext<CaptureApi | null>(null);

export function useCapture(): CaptureApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useCapture вне CaptureHost');
  return api;
}

/**
 * Запись голосом или текстом с любой вкладки: живёт над табами, а не внутри экрана,
 * поэтому микрофон в таб-баре работает везде одинаково.
 */
export function CaptureHost({ children }: { children: ReactNode }) {
  const capture = useMealCapture();
  const [overlay, setOverlay] = useState<OverlayMode | null>(null);
  const [heard, setHeard] = useState('');

  const handlePhrase = useCallback(
    async (text: string) => {
      setHeard(text);
      setOverlay('parsing');
      await capture.parse(text);
      setOverlay(null);
    },
    [capture],
  );
  const voice = useVoice((text) => void handlePhrase(text));

  // Островок переключается в «Слушаю» с таймером, пока идёт запись.
  useEffect(() => setRecording(voice.state === 'listening'), [voice.state]);

  const toggleVoice = useCallback(() => {
    if (voice.state === 'listening') return voice.stop();
    if (!voiceSupported) return setOverlay('text');
    void voice.start();
  }, [voice]);

  const api = useMemo<CaptureApi>(
    () => ({
      toggleVoice,
      openText: () => setOverlay('text'),
      parsePending: async (text: string, id: string) => {
        await capture.parse(text, id);
      },
      recording: voice.state === 'listening',
    }),
    [toggleVoice, voice.state, capture],
  );

  const mode: OverlayMode | null = voice.state === 'listening' ? 'listening' : voice.state === 'error' ? 'error' : overlay;

  return (
    <Ctx.Provider value={api}>
      {children}
      <ListeningOverlay
        mode={mode}
        level={voice.level}
        heardSomething={voice.heardSomething}
        phrase={heard}
        error={voice.error}
        onStop={voice.stop}
        onCancel={() => {
          voice.cancel();
          voice.reset();
          setOverlay(null);
        }}
        onSwitchToText={() => {
          voice.reset();
          setOverlay('text');
        }}
        onSubmitText={(text) => void handlePhrase(text)}
      />
      <ConfirmSheet draft={capture.draft} source={capture.source} offlineReason={capture.offlineReason} onChange={capture.setDraft} onConfirm={capture.confirm} onCancel={capture.cancel} />
    </Ctx.Provider>
  );
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, useWindowDimensions } from 'react-native';
import { tap } from '@/lib/haptics';
import { Page, useStore } from '@/state/store';

interface PagerApi {
  go(page: Page): void;
}

const Ctx = createContext<PagerApi>({ go: () => {} });

/** Перейти на раздел главного: дневник · сегодня · прогресс. */
export const usePager = () => useContext(Ctx);

/**
 * Три раздела рядом, листаются пальцем в обе стороны, как вкладки в системных
 * приложениях. Раздел хранится в сторе: на него переключают и кнопки внизу,
 * и ссылки (levelup://diary), и тап по дню в прогрессе.
 */
export function Pager({ pages, overlay }: { pages: [ReactNode, ReactNode, ReactNode]; overlay?: ReactNode }) {
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const shown = useRef(page);

  // Раздел сменили не пальцем (кнопкой, ссылкой) — докручиваем.
  useEffect(() => {
    if (shown.current === page) return;
    shown.current = page;
    ref.current?.scrollTo({ x: page * width, animated: true });
  }, [page, width]);

  const onEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width) as Page;
      if (next === shown.current) return;
      shown.current = next;
      tap();
      setPage(next);
    },
    [width, setPage],
  );

  const api = useMemo<PagerApi>(() => ({ go: setPage }), [setPage]);

  return (
    <Ctx.Provider value={api}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: page * width, y: 0 }}
          onMomentumScrollEnd={onEnd}
          scrollEventThrottle={16}
        >
          {pages.map((p, i) => (
            <View key={i} style={{ width, flex: 1 }}>
              {p}
            </View>
          ))}
        </ScrollView>
        {overlay}
      </View>
    </Ctx.Provider>
  );
}

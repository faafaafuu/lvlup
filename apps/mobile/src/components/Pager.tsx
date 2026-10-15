import { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { tap } from '@/lib/haptics';
import { Page, useStore } from '@/state/store';

interface PagerApi {
  go(page: Page): void;
}

const Ctx = createContext<PagerApi>({ go: () => {} });

/** Перейти на раздел главного: дневник · сегодня · прогресс. */
export const usePager = () => useContext(Ctx);

/**
 * Три раздела рядом, листаются пальцем в обе стороны — системный UIPageViewController
 * (react-native-pager-view): он сам договаривается с вертикальной прокруткой страниц.
 * Раздел хранится в сторе: на него переключают кнопки внизу, ссылки и тап по дню.
 */
export function Pager({ pages, overlay }: { pages: [ReactNode, ReactNode, ReactNode]; overlay?: ReactNode }) {
  const ref = useRef<PagerView>(null);
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const shown = useRef(page);

  // Раздел сменили не пальцем (кнопкой, ссылкой) — перелистываем.
  useEffect(() => {
    if (shown.current === page) return;
    shown.current = page;
    ref.current?.setPage(page);
  }, [page]);

  const api = useMemo<PagerApi>(() => ({ go: setPage }), [setPage]);

  return (
    <Ctx.Provider value={api}>
      <View style={{ flex: 1 }}>
        <PagerView
          ref={ref}
          style={{ flex: 1 }}
          initialPage={page}
          overdrag={false}
          onPageSelected={(e) => {
            const next = e.nativeEvent.position as Page;
            if (next === shown.current) return;
            shown.current = next;
            tap();
            setPage(next);
          }}
        >
          {pages.map((p, i) => (
            <View key={i} style={{ flex: 1 }} collapsable={false}>
              {p}
            </View>
          ))}
        </PagerView>
        {overlay}
      </View>
    </Ctx.Provider>
  );
}

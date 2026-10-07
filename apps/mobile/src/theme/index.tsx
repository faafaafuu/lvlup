import { useColorScheme } from 'react-native';
import { Theme, makeTheme } from '@/design/theme';
import { useStore } from '@/state/store';
import { Palette, tokens } from './tokens';

export { tokens };
export { fonts } from '@/design/theme';
export type { Palette, Theme };

/** Тема из дизайна + выбор пользователя в Настройках (system / dark / light). */
export function useTheme(): Theme & { dark: boolean } {
  const system = useColorScheme();
  const pref = useStore((s) => s.settings.theme);
  const dark = pref === 'system' ? system !== 'light' : pref === 'dark';
  return { ...makeTheme(dark ? 'dark' : 'light'), dark };
}

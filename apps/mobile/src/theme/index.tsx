import { useColorScheme } from 'react-native';
import { useStore } from '@/state/store';
import { Palette, tokens } from './tokens';

export { tokens };
export type { Palette };

export function useTheme(): { c: Palette; dark: boolean } {
  const system = useColorScheme();
  const pref = useStore((s) => s.settings.theme);
  const dark = pref === 'system' ? system !== 'light' : pref === 'dark';
  return { c: dark ? tokens.color.dark : tokens.color.light, dark };
}

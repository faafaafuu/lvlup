import { useColorScheme } from 'react-native';
import tokens from './tokens.json';

export type ThemeName = 'dark' | 'light';
export type Colors = typeof tokens.color.dark;

/** Derived colors that are not part of the token contract but used by components. */
const derived = {
  dark: {
    track: '#2C3140',
    pressed: '#1F2330',
    primaryPressed: '#7F68F0',
    primarySoft: 'rgba(149,128,255,0.16)',
    successSoft: 'rgba(61,220,151,0.14)',
    warningSoft: 'rgba(255,181,71,0.14)',
    disabledText: '#7D8396',
    scrim: 'rgba(5,6,10,0.72)',
    toastBg: '#F2F3F7',
    toastText: '#14151C',
    /** «чуть выше плана» — нейтральный, не красный */
    over: '#C9CCD6',
  },
  light: {
    track: '#E2E3EC',
    pressed: '#EFEFF5',
    primaryPressed: '#5A3DDB',
    primarySoft: 'rgba(106,76,240,0.10)',
    successSoft: 'rgba(14,128,80,0.10)',
    warningSoft: 'rgba(232,169,58,0.18)',
    disabledText: '#8A8FA0',
    scrim: 'rgba(20,21,28,0.45)',
    toastBg: '#1C1E27',
    toastText: '#F2F3F7',
    over: '#5B6072',
  },
};

export const fonts = {
  /** Unbounded (expo-google-fonts/unbounded). Fallback: Rubik → system rounded. */
  display: 'Unbounded_700Bold',
  displayMedium: 'Unbounded_500Medium',
  displayFallback: 'Rubik_700Bold',
  /** SF Pro on iOS = default system font */
  body: undefined as string | undefined,
};

export const size = tokens.font.sizes;
export const radius = tokens.radius;
export const space = tokens.space;

export function makeTheme(name: ThemeName) {
  const c = { ...tokens.color[name], ...derived[name] };
  return {
    name,
    c,
    shadow: {
      card: { shadowColor: '#000', shadowOpacity: name === 'dark' ? 0.24 : 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
      glow: { shadowColor: c.primary, shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
    },
  };
}
export type Theme = ReturnType<typeof makeTheme>;

/** pref: 'system' | 'dark' | 'light' — from Settings → Тема */
export function useTheme(pref: 'system' | ThemeName = 'system'): Theme {
  const sys = useColorScheme();
  const name: ThemeName = pref === 'system' ? (sys === 'light' ? 'light' : 'dark') : pref;
  return makeTheme(name);
}

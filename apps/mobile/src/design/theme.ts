import { useColorScheme } from 'react-native';
import tokens from './tokens.json';

export type ThemeName = 'dark' | 'light';

/**
 * Производные цвета — не входят в контракт tokens.json, но нужны компонентам.
 * Принцип бренда: тёмная тема — лаймовые акценты на графите;
 * светлая — чернильные CTA с лаймовым текстом, кольца и полосы — чернилами.
 */
const derived = {
  dark: {
    fill: 'rgba(255,255,255,0.07)',
    fillPressed: 'rgba(255,255,255,0.14)',
    segOn: '#3A3A3E',
    track: 'rgba(255,255,255,0.09)',
    sep: 'rgba(255,255,255,0.08)',
    ring: '#D4FF3A',
    bar: '#D4FF3A',
    btn: '#D4FF3A',
    btnPressed: '#BCE52B',
    onBtn: '#0C0C0E',
    btnDisabled: 'rgba(255,255,255,0.06)',
    onBtnDisabled: '#6B6B71',
    accentText: '#D4FF3A',
    doneFill: 'rgba(212,255,58,0.14)',
    glow: 'rgba(212,255,58,0.20)',
    over: '#5C5C62', // «чуть выше плана» — нейтральный
    glass: 'rgba(30,30,33,0.72)',
    toastBg: '#F4F4F0',
    toastText: '#0C0C0E',
    scrim: 'rgba(0,0,0,0.6)',
  },
  light: {
    fill: 'rgba(17,17,19,0.05)',
    fillPressed: 'rgba(17,17,19,0.11)',
    segOn: '#FFFFFF',
    track: 'rgba(17,17,19,0.08)',
    sep: 'rgba(17,17,19,0.08)',
    ring: '#111113',
    bar: '#111113',
    btn: '#111113',
    btnPressed: '#2A2A2E',
    onBtn: '#D4FF3A',
    btnDisabled: 'rgba(17,17,19,0.05)',
    onBtnDisabled: '#A3A3A8',
    accentText: '#4D7C0F',
    doneFill: 'rgba(212,255,58,0.55)',
    glow: 'rgba(212,255,58,0.60)',
    over: '#C9C9C4',
    glass: 'rgba(255,255,255,0.78)',
    toastBg: '#111113',
    toastText: '#F4F4F0',
    scrim: 'rgba(17,17,19,0.32)',
  },
};

export const fonts = {
  /** @expo-google-fonts/geologica — цифры, уровни, заголовки экранов */
  display: 'Geologica_600SemiBold',
  displayBold: 'Geologica_700Bold',
  /** SF Pro на iOS = системный шрифт */
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
    blurTint: name === 'dark' ? ('systemChromeMaterialDark' as const) : ('systemChromeMaterialLight' as const),
    shadow: {
      card: { shadowColor: '#000', shadowOpacity: name === 'dark' ? 0.2 : 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
      glow: { shadowColor: name === 'dark' ? '#D4FF3A' : '#111113', shadowOpacity: name === 'dark' ? 0.35 : 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
    },
  };
}
export type Theme = ReturnType<typeof makeTheme>;

/** pref из Настройки → Тема: 'system' | 'dark' | 'light' */
export function useTheme(pref: 'system' | ThemeName = 'system'): Theme {
  const sys = useColorScheme();
  return makeTheme(pref === 'system' ? (sys === 'light' ? 'light' : 'dark') : pref);
}

import { useColorScheme } from 'react-native';
import { useStore } from '@/state/store';

/**
 * Три темы из макета design/level-up-screens: тёмная «Анфилада», синяя «Кобальт»,
 * сиреневая «Ковёр». «Авто» = Анфилада ночью и Кобальт днём (по системной теме).
 */
export type ThemeName = 'dark' | 'cobalt' | 'carpet';
export type ThemePref = ThemeName | 'system';

export interface Theme {
  name: ThemeName;
  light: boolean;
  bg: string;
  sf: string;
  sf2: string;
  tx: string;
  mu: string;
  ln: string;
  track: string;
  cta: string;
  onCta: string;
  ctaGlow: string;
  haze: { color: string; opacity: number };
  tgl: string;
  food: string;
  steps: string;
  xp: string;
  coin: string;
  protein: string;
  fat: string;
  carbs: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark', light: false,
    bg: '#0A0A0C', sf: '#141418', sf2: '#23232B', tx: '#FFFFFF', mu: '#8A8A93', ln: 'rgba(255,255,255,0.12)', track: 'rgba(255,255,255,0.08)',
    cta: '#E8202A', onCta: '#FFFFFF', ctaGlow: 'rgba(232,32,42,0.45)', haze: { color: '#1E86F0', opacity: 0.18 }, tgl: '#19B6B9',
    food: '#1E86F0', steps: '#8E5BF0', xp: '#E8202A', coin: '#E7C46A', protein: '#1E86F0', fat: '#8E5BF0', carbs: '#19B6B9',
  },
  cobalt: {
    name: 'cobalt', light: true,
    bg: '#1C74DA', sf: 'rgba(0,30,90,0.20)', sf2: 'rgba(255,255,255,0.16)', tx: '#FFFFFF', mu: '#C4DAF7', ln: 'rgba(255,255,255,0.26)', track: 'rgba(0,20,70,0.22)',
    cta: '#0A0A0C', onCta: '#FFFFFF', ctaGlow: 'rgba(0,10,40,0.40)', haze: { color: '#FFFFFF', opacity: 0.12 }, tgl: '#0A0A0C',
    food: '#E8202A', steps: '#0A0A0C', xp: '#C9A8FF', coin: '#FFD66B', protein: '#E8202A', fat: '#0A0A0C', carbs: '#C9A8FF',
  },
  carpet: {
    name: 'carpet', light: true,
    bg: '#A3B6EE', sf: 'rgba(255,255,255,0.32)', sf2: 'rgba(255,255,255,0.62)', tx: '#0A0A0C', mu: '#34477F', ln: 'rgba(10,10,40,0.16)', track: 'rgba(10,20,90,0.13)',
    cta: '#0A0A0C', onCta: '#FFFFFF', ctaGlow: 'rgba(10,20,80,0.30)', haze: { color: '#FFFFFF', opacity: 0.4 }, tgl: '#1E6FE0',
    food: '#1E6FE0', steps: '#E8202A', xp: '#0A0A0C', coin: '#9A6B00', protein: '#1E6FE0', fat: '#E8202A', carbs: '#0A0A0C',
  },
};

export const FONT = {
  num200: 'Unbounded_200ExtraLight',
  num300: 'Unbounded_300Light',
  num400: 'Unbounded_400Regular',
  mono: 'JetBrainsMono_400Regular',
  mono500: 'JetBrainsMono_500Medium',
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const pref = useStore((s) => s.settings.theme) as ThemePref;
  const name: ThemeName = pref === 'system' ? (system === 'light' ? 'cobalt' : 'dark') : (THEMES[pref] ? pref : 'dark');
  return THEMES[name];
}

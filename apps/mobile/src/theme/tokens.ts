/**
 * Дизайн-токены в той же структуре, что запрошена в docs/design-prompt.md:
 * когда придёт JSON от дизайна — заменить значения здесь, код трогать не нужно.
 */
export const tokens = {
  color: {
    dark: {
      bg: '#0E1220',
      surface: '#171C2E',
      surfaceAlt: '#20273D',
      text: '#F2F4FA',
      textMuted: '#8F98B3',
      border: '#2A3250',
      primary: '#7C5CFF',
      onPrimary: '#FFFFFF',
      xp: '#3EE58F',
      coin: '#FFC83D',
      streak: '#FF8A3D',
      success: '#3EE58F',
      warning: '#FFB547',
      danger: '#FF5D6C',
      protein: '#5AA9FF',
      fat: '#FFB547',
      carbs: '#B98CFF',
    },
    light: {
      bg: '#F5F6FB',
      surface: '#FFFFFF',
      surfaceAlt: '#ECEEF7',
      text: '#141827',
      textMuted: '#5D6580',
      border: '#DDE1EE',
      primary: '#6544F0',
      onPrimary: '#FFFFFF',
      xp: '#14B866',
      coin: '#D99A00',
      streak: '#E8690F',
      success: '#14B866',
      warning: '#C97E00',
      danger: '#D93445',
      protein: '#2D7FE0',
      fat: '#C97E00',
      carbs: '#8A55E8',
    },
  },
  font: {
    display: 'System',
    body: 'System',
    sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, xxl: 40 },
  },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  space: [0, 4, 8, 12, 16, 20, 24, 32, 48],
} as const;

export type Palette = { [K in keyof typeof tokens.color.dark]: string };

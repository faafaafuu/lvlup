import json from '@/design/tokens.json';

/** Токены из дизайн-хендоффа (design/level-up/tokens.json) — единственный источник цветов и размеров. */
export const tokens = json;
export type Palette = ReturnType<typeof import('@/design/theme').makeTheme>['c'];

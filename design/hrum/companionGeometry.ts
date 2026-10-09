// Level Up — компаньон «Лайм». viewBox 0 0 200 200, земля на y≈188.
// Чистые функции → path-строки и цвета. Тот же расчёт, что в макете (Companion.dc.html) и SVG-экспорте.

export type Stage = 1 | 2 | 3;
export type Mood = 'idle' | 'happy' | 'wave' | 'sleepy';
export type BodyColor = 'lime' | 'mint' | 'peach' | 'sky' | 'lilac';
export type Crest = 'leaf' | 'flame' | 'star';
export type Accessory = 'none' | 'band' | 'cape' | 'crown';

export interface CompanionOptions {
  stage: Stage;
  mood: Mood;
  color: BodyColor;
  crest: Crest;
  accessory: Accessory;
}

/** 4 тона на окрас: блик, основной, тень, глубокая тень. */
export const PALETTE: Record<BodyColor, { hi: string; mid: string; lo: string; deep: string }> = {
  lime: { hi: '#F6FFC4', mid: '#D2F54A', lo: '#8DBE1C', deep: '#557A0A' },
  mint: { hi: '#DDFFF1', mid: '#7CE6BC', lo: '#2FA37C', deep: '#1B6C52' },
  peach: { hi: '#FFEBDD', mid: '#FFB28A', lo: '#E3753F', deep: '#A84D22' },
  sky: { hi: '#E6F3FF', mid: '#93C8FF', lo: '#4386DE', deep: '#28599E' },
  lilac: { hi: '#F3EBFF', mid: '#C4A8FF', lo: '#7E5EDC', deep: '#4F37A0' },
};

export const CREST_COLORS: Record<Crest, { hi: string; lo: string }> = {
  leaf: { hi: '#9EE84A', lo: '#2F7D1C' },
  flame: { hi: '#FFE38A', lo: '#FF6A2B' },
  star: { hi: '#FFF1B8', lo: '#F0A81E' },
};

export const FIXED = {
  ink: '#141416',
  mouth: '#1C1216',
  tongue: '#FF7B8A',
  cheek: '#FF7E92',
  gold: ['#FFE7A0', '#E39A1E'] as const,
  band: ['#FF7A6B', '#D93A3A'] as const,
  scarf: ['#FFC56B', '#C9700F'] as const,
  aura: '#D4FF3A',
};

/** Тело одно для всех стадий — меняется масштаб. */
export const BODY_PATH = 'M100 62C140 62 164 94 164 130C164 164 136 184 100 184C64 184 36 164 36 130C36 94 60 62 100 62Z';
export const STAGE_SCALE: Record<Stage, number> = { 1: 0.8, 2: 0.9, 3: 1 };
export const GROUND_Y = 188;

function crestShape(type: Crest, stage: Stage): { stem: string; path: string; vein: string } {
  if (type === 'flame') {
    const p = stage === 1 ? 'M100 66C90 60 92 48 98 42C98 50 102 51 104 47C108 54 110 61 100 66Z'
      : stage === 2 ? 'M100 66C84 58 86 40 96 30C96 41 102 43 105 36C112 46 118 58 100 66Z'
      : 'M100 66C80 58 80 36 94 20C94 34 101 37 104 28C110 36 112 24 110 18C124 34 124 58 100 66Z';
    return { stem: '', path: p, vein: '' };
  }
  if (type === 'star') {
    const R = stage === 1 ? 10 : stage === 2 ? 14 : 18, cy = 64 - R - 6, cx = 100, r = R * 0.28;
    const star = `M${cx} ${cy - R}Q${cx + r} ${cy - r} ${cx + R} ${cy}Q${cx + r} ${cy + r} ${cx} ${cy + R}Q${cx - r} ${cy + r} ${cx - R} ${cy}Q${cx - r} ${cy - r} ${cx} ${cy - R}Z`;
    return { stem: `M100 64L100 ${cy + R - 2}`, path: star, vein: '' };
  }
  if (stage === 1) return { stem: 'M100 64Q99 58 101 52', path: 'M101 54C106 42 118 37 128 39C125 51 114 56 101 54Z', vein: 'M104 52Q114 45 124 42' };
  if (stage === 2) return { stem: 'M100 64Q99 56 101 49', path: 'M100 57C91 43 77 39 67 43C72 56 86 61 100 57ZM101 51C108 35 125 28 139 31C135 48 118 55 101 51Z', vein: 'M97 55Q84 47 72 45M104 49Q119 39 134 34' };
  return { stem: 'M100 64Q99 54 101 44', path: 'M100 57C91 43 77 39 67 43C72 56 86 61 100 57ZM101 51C108 35 125 28 139 31C135 48 118 55 101 51ZM100 47C92 32 95 16 104 6C112 20 110 36 100 47Z', vein: 'M97 55Q84 47 72 45M104 49Q119 39 134 34M101 44Q102 28 104 12' };
}

const ARMS: Record<Mood, [Arm, Arm]> = {
  idle: [{ x: 36, y: 142, r: 22 }, { x: 164, y: 142, r: -22 }],
  happy: [{ x: 40, y: 104, r: 36 }, { x: 160, y: 104, r: -36 }],
  wave: [{ x: 36, y: 142, r: 22 }, { x: 162, y: 102, r: -34 }],
  sleepy: [{ x: 37, y: 146, r: 14 }, { x: 163, y: 146, r: -14 }],
};
export interface Arm { x: number; y: number; r: number }

export function companionParts(o: CompanionOptions) {
  const s = STAGE_SCALE[o.stage];
  const cs = crestShape(o.crest, o.stage);
  const happy = o.mood === 'happy';
  const sleepy = o.mood === 'sleepy';
  return {
    colors: PALETTE[o.color],
    crestColors: CREST_COLORS[o.crest],
    scale: s,
    /** transform для группы тела: масштаб от точки (100, 188) */
    stageTransform: `translate(100 ${GROUND_Y}) scale(${s}) translate(-100 -${GROUND_Y})`,
    auraR: o.accessory === 'crown' || o.stage === 3 ? 96 : 0,
    shadowRx: Math.round(50 * s),
    arms: ARMS[o.mood],
    eyesOpen: !(happy || sleepy),
    eyesClosed: happy ? 'M77 124Q84 114 91 124M109 124Q116 114 123 124' : sleepy ? 'M77 121Q84 127 91 121M109 121Q116 127 123 121' : '',
    mouthLine: happy ? '' : sleepy ? 'M96 138Q100 140 104 138' : 'M94 135Q100 141 106 135',
    mouthOpen: happy ? 'M91 133Q100 148 109 133Z' : '',
    crest: cs,
    crestOffsetY: o.accessory === 'crown' ? -10 : 0,
    band: o.accessory === 'band' ? 'M45 104C70 84 130 84 155 104L159 114C132 95 68 95 41 114ZM156 106L172 98L170 114Z' : '',
    scarf: o.accessory === 'cape' ? 'M39 144Q100 170 161 144L163 157Q100 186 37 157ZM124 162L139 160L147 190L131 191Z' : '',
    crown: o.accessory === 'crown' ? 'M76 72L72 48L88 60L100 40L112 60L128 48L124 72Z' : '',
    crownGems: o.accessory === 'crown' ? 'M97.5 60a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0ZM83 66a2 2 0 1 0 4 0a2 2 0 1 0-4 0ZM113 66a2 2 0 1 0 4 0a2 2 0 1 0-4 0Z' : '',
  };
}

/** Аксессуар по уровню: 3 → повязка, 5 → шарф героя, 10 → корона. */
export function accessoryForLevel(level: number): Accessory {
  if (level >= 10) return 'crown';
  if (level >= 5) return 'cape';
  if (level >= 3) return 'band';
  return 'none';
}
/** Стадия эволюции по уровню: 1–4 Росток, 5–9 Побег, 10+ Древо. */
export function stageForLevel(level: number): Stage {
  return level >= 10 ? 3 : level >= 5 ? 2 : 1;
}

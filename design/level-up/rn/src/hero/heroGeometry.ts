// Level Up — hero geometry. viewBox 0 0 200 300, feet on y≈285.
// Pure functions → SVG path strings. Shared by SVG export and RN <Hero/>.

export type Gender = 'm' | 'f';
export type Stage = 0 | 1 | 2;
export type Pose = 'idle' | 'cheer' | 'wave';
export type Accessory = 'none' | 'headband' | 'cloak' | 'crown';
export interface StageParams { S: number; W: number; H: number; B: number; leg: number; arm: number }
export interface HeroOptions { gender: Gender; stage: Stage; pose: Pose; hair: 0 | 1 | 2; accessory: Accessory }

export const STAGES: Record<Gender, StageParams[]> = {
  m: [
    { S: 35, W: 39, H: 35, B: 6, leg: 23, arm: 16 }, // stage-0 мягкий
    { S: 37, W: 31, H: 30, B: 2, leg: 19, arm: 14 }, // stage-1
    { S: 43, W: 25, H: 28, B: 0, leg: 19, arm: 15 }, // stage-2 спортивный
  ],
  f: [
    { S: 30, W: 35, H: 39, B: 6, leg: 23, arm: 15 },
    { S: 30, W: 27, H: 34, B: 2, leg: 18, arm: 13 },
    { S: 32, W: 23, H: 32, B: 0, leg: 17, arm: 13 },
  ],
};

export const HAIR: Record<Gender, string[]> = {
  m: [
    // m-crop
    'M71 60C71 36 87 29 100 29C114 29 129 36 129 60C125 48 116 43 100 43C86 43 76 48 71 60Z',
    // m-side
    'M70 64C67 38 85 27 102 27C120 27 133 40 130 62C127 52 123 46 117 43C105 50 89 48 78 46C74 52 72 58 70 64Z',
    // m-quiff
    'M71 58C69 40 81 25 97 23C106 16 123 20 125 31C131 37 131 50 129 58C125 46 114 41 100 41C88 41 78 46 71 58Z',
  ],
  f: [
    // f-bob
    'M69 84C62 50 75 27 100 27C125 27 138 50 131 84C127 87 122 85 122 80L124 58C118 46 104 43 92 39C86 46 78 50 76 58L78 80C78 85 73 87 69 84Z',
    // f-ponytail
    'M71 58C69 38 84 27 100 27C116 27 131 38 129 58C123 46 111 41 100 41C88 41 78 46 71 58ZM126 38C144 38 151 62 142 88C138 98 130 96 132 87C137 70 135 54 123 47Z',
    // f-long
    'M67 104C58 62 69 27 100 27C131 27 142 62 133 104C129 108 122 106 122 100L124 60C116 47 100 43 88 41C84 50 78 54 76 62L78 100C78 106 71 108 67 104Z',
  ],
};

export const circle = (cx: number, cy: number, r: number): string => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
export const ellipse = (cx: number, cy: number, rx: number, ry: number): string => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const r1 = (n: number): number => Math.round(n * 10) / 10;

function torso(S: number, W: number, H: number, B: number, bottom: number, neckDip: boolean): string {
  const L = (x: number) => r1(100 - x), R = (x: number) => r1(100 + x);
  return `M${L(S - 9)} ${neckDip ? 102 : 100}` +
    (neckDip ? `Q100 113 ${R(S - 9)} 102` : `L${R(S - 9)} 100`) +
    `Q${R(S)} 100 ${R(S)} 112C${R(S)} 130 ${R(W + B)} 138 ${R(W + B)} 152` +
    `C${R(W + B)} 164 ${R(H)} 168 ${R(H)} ${bottom}L${L(H)} ${bottom}` +
    `C${L(H)} 168 ${L(W + B)} 164 ${L(W + B)} 152C${L(W + B)} 138 ${L(S)} 130 ${L(S)} 112` +
    `Q${L(S)} 100 ${L(S - 9)} ${neckDip ? 102 : 100}Z`;
}

function arm(side: -1 | 1, s: StageParams, pose: Pose) {
  // side: -1 left (viewer's left), +1 right
  const sx = 100 + side * (s.S - 6), sy = 110;
  let e: [number, number], h: [number, number];
  const up = pose === 'cheer' || (pose === 'wave' && side === 1);
  if (!up) { e = [100 + side * (s.S + 6), 140]; h = [100 + side * (s.S + 7), 170]; }
  else if (pose === 'cheer') { e = [100 + side * (s.S + 17), 92]; h = [100 + side * (s.S + 12), 58]; }
  else { e = [100 + side * (s.S + 22), 104]; h = [100 + side * (s.S + 28), 70]; }
  const limb = `M${r1(sx)} ${sy}Q${r1(e[0])} ${e[1]} ${r1(h[0])} ${h[1]}`;
  const k = 0.42;
  const sleeve = `M${r1(sx)} ${sy}L${r1(sx + k * (e[0] - sx))} ${r1(sy + k * (e[1] - sy))}`;
  return { limb, sleeve, hand: circle(r1(h[0]), h[1], r1(s.arm / 2 + 1)) };
}

function leg(side: -1 | 1, s: StageParams) {
  const x = r1(100 + side * (s.H - 12));
  return {
    limb: `M${x} 196L${r1(x - side * 1)} 272`,
    shoe: `M${r1(x - 12)} 277Q${r1(x - 12)} 268 ${x} 268Q${r1(x + 13)} 268 ${r1(x + 14)} 279L${r1(x + 14)} 283` +
      `Q${r1(x + 14)} 286 ${r1(x + 11)} 286L${r1(x - 9)} 286Q${r1(x - 12)} 286 ${r1(x - 12)} 283Z`,
  };
}

const ACCESSORY: Record<string, { back: string; front: string } | null> = {
  none: { back: '', front: '' },
  headband: { back: '', front: 'M71 49C84 41 116 41 129 49L129 57C116 49 84 49 71 57Z' },
  cloak: null, // depends on stage → see cloak()
  crown: {
    back: '', // aura ring is drawn as separate stroke, see heroParts
    front: 'M80 36L83 15L92 27L100 11L108 27L117 15L120 36Z',
  },
};

function cloak(s: StageParams) {
  const L = (x: number) => r1(100 - x), R = (x: number) => r1(100 + x);
  return {
    back: `M${L(s.S - 4)} 102C${L(s.S + 22)} 140 ${L(s.S + 30)} 210 ${L(s.S + 26)} 252L${R(s.S + 26)} 252` +
      `C${R(s.S + 30)} 210 ${R(s.S + 22)} 140 ${R(s.S - 4)} 102Z`,
    front: `M${L(s.S - 6)} 101Q100 116 ${R(s.S - 6)} 101L${R(s.S - 2)} 106Q100 122 ${L(s.S - 2)} 106Z` +
      circle(100, 112, 4.5),
  };
}

/**
 * @param {{gender:'m'|'f', stage:0|1|2, pose:'idle'|'cheer'|'wave', hair:0|1|2, accessory:'none'|'headband'|'cloak'|'crown'}} o
 */
export function heroParts(o: HeroOptions) {
  const s = STAGES[o.gender][o.stage];
  const acc = o.accessory === 'cloak' ? cloak(s) : (ACCESSORY[o.accessory || 'none'] as { back: string; front: string });
  const L = arm(-1, s, o.pose), R = arm(1, s, o.pose);
  const lg = leg(-1, s), rg = leg(1, s);
  const shortsTop = r1(s.W + s.B + 1), hip = r1(s.H + 3);
  return {
    stageParams: s,
    aura: o.accessory === 'crown' ? ellipse(100, 160, 84, 128) : '',
    accessoryBack: acc.back,
    shadow: ellipse(100, 286, 46, 6),
    legs: { left: lg.limb, right: rg.limb, shoeL: lg.shoe, shoeR: rg.shoe, width: s.leg },
    body: { neck: 'M91 84H109V108H91Z', torso: torso(s.S, s.W, s.H, s.B, 182, false) },
    outfitBottom:
      `M${r1(100 - shortsTop)} 160L${r1(100 + shortsTop)} 160C${r1(100 + hip)} 170 ${r1(100 + hip)} 180 ${r1(100 + hip)} 214` +
      `L104 214L100 198L96 214L${r1(100 - hip)} 214C${r1(100 - hip)} 180 ${r1(100 - hip)} 170 ${r1(100 - shortsTop)} 160Z`,
    outfitTop: torso(s.S + 1.5, s.W + 1.5, s.H + 1.5, s.B, 172, true),
    arms: { left: L, right: R, width: s.arm, sleeveWidth: s.arm + 6 },
    head: { ears: circle(73, 64, 6) + circle(127, 64, 6), face: circle(100, 62, 29) },
    face: {
      eyes: ellipse(89, 64, 3.2, 4) + ellipse(111, 64, 3.2, 4),
      brows: 'M84 55Q89 52 94 55M106 55Q111 52 116 55',
      mouth: o.pose === 'cheer' ? 'M91 72Q100 85 109 72Z' : 'M92 74Q100 80 108 74',
      mouthFilled: o.pose === 'cheer',
      cheeks: circle(82, 72, 4) + circle(118, 72, 4),
    },
    hair: HAIR[o.gender][o.hair || 0],
    accessoryFront: acc.front,
  };
}

export const PALETTE = {
  skin: ['#F7D9C4', '#EDBB97', '#C98F63', '#9B6541', '#5E3C27'],
  outfit: ['#7B5CFF', '#16A394', '#FF7A59', '#3D8BFF', '#E8A93A', '#3A3F4B'],
  hair: ['#2B2233', '#6B3E26', '#C9A26B', '#B2452E'],
  ink: '#2A2433',
  shoes: '#2A2433',
  cheek: '#FF7F7F',
  accessory: { headband: '#FF7A59', cloak: '#7B5CFF', crown: '#F5C041' },
};


export type HeroParts = ReturnType<typeof heroParts>;

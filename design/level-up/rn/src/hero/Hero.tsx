import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { heroParts, HeroOptions, PALETTE } from './heroGeometry';

export type HeroColors = {
  skin: string;         // PALETTE.skin[0..4]
  outfitTop: string;    // PALETTE.outfit[0..5]
  outfitBottom?: string;
  hair: string;         // PALETTE.hair[0..3]
  shoes?: string;
  ink?: string;
  accessory?: string;
};

type Props = HeroOptions & {
  colors: HeroColors;
  /** width in pt; height = width × 1.5 */
  size?: number;
  /** breathing + blinking (only on the main screen) */
  animated?: boolean;
  onPress?: () => void; // tap → wardrobe
};

export function Hero({ colors, size = 200, animated = false, onPress, ...o }: Props) {
  const p = useMemo(() => heroParts(o), [o.gender, o.stage, o.pose, o.hair, o.accessory]);
  const c = {
    skin: colors.skin,
    top: colors.outfitTop,
    bottom: colors.outfitBottom ?? PALETTE.outfit[5],
    hair: colors.hair,
    shoes: colors.shoes ?? PALETTE.shoes,
    ink: colors.ink ?? PALETTE.ink,
    acc: colors.accessory ?? (PALETTE.accessory as Record<string, string>)[o.accessory] ?? '#F5C041',
  };

  // idle: breathing 3 s loop, blink every 4–6 s (150 ms)
  const breath = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animated) return;
    let stopped = false;
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || stopped) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
    });
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 150); schedule(); }, 4000 + Math.random() * 2000);
    };
    schedule();
    return () => { stopped = true; loop?.stop(); clearTimeout(t); };
  }, [animated, breath]);

  // scaleY 1 → 1.015 around feet (y = 285)
  const sy = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });
  const ty = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -(size * 1.5) * (285 / 300 - 0.5) * 0.015] });

  const arm = (a: typeof p.arms.left) => (
    <>
      <Path d={a.limb} stroke={c.skin} strokeWidth={p.arms.width} fill="none" />
      <Path d={a.hand} fill={c.skin} />
      <Path d={a.sleeve} stroke={c.top} strokeWidth={p.arms.sleeveWidth} fill="none" />
    </>
  );

  const svg = (
    <Svg width={size} height={size * 1.5} viewBox="0 0 200 300" accessibilityRole="image" accessibilityLabel="Герой">
      <G id="accessory-back">
        {!!p.aura && <Path d={p.aura} fill="none" stroke={c.acc} strokeOpacity={0.35} strokeWidth={6} />}
        {!!p.accessoryBack && <Path d={p.accessoryBack} fill={c.acc} />}
      </G>
      <G id="shadow"><Path d={p.shadow} fill="#000" fillOpacity={0.18} /></G>
      <G>
        <G id="legs" strokeLinecap="round">
          <Path d={p.legs.left} stroke={c.skin} strokeWidth={p.legs.width} fill="none" />
          <Path d={p.legs.right} stroke={c.skin} strokeWidth={p.legs.width} fill="none" />
          <Path d={p.legs.shoeL} fill={c.shoes} />
          <Path d={p.legs.shoeR} fill={c.shoes} />
        </G>
        <G id="body"><Path d={p.body.neck} fill={c.skin} /><Path d={p.body.torso} fill={c.skin} /></G>
        <G id="outfit-bottom"><Path d={p.outfitBottom} fill={c.bottom} /></G>
        <G id="outfit-top"><Path d={p.outfitTop} fill={c.top} /></G>
        <G id="arms" strokeLinecap="round">{arm(p.arms.left)}{arm(p.arms.right)}</G>
        <G id="head"><Path d={p.head.ears} fill={c.skin} /><Path d={p.head.face} fill={c.skin} /></G>
        <G id="face">
          <Path d={p.face.cheeks} fill="#FF7F7F" fillOpacity={0.35} />
          <G id="eyes" scaleY={blink ? 0.1 : 1} originY={64}><Path d={p.face.eyes} fill={c.ink} /></G>
          <Path d={p.face.brows} stroke={c.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" />
          {p.face.mouthFilled
            ? <Path d={p.face.mouth} fill={c.ink} />
            : <Path d={p.face.mouth} stroke={c.ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />}
        </G>
        <G id="hair"><Path d={p.hair} fill={c.hair} /></G>
        <G id="accessory">{!!p.accessoryFront && <Path d={p.accessoryFront} fill={c.acc} />}</G>
      </G>
    </Svg>
  );
  // breathing: scale the whole figure from the feet line (y = 285 of 300)
  const body = <Animated.View style={{ transform: [{ translateY: ty }, { scaleY: sy }] }}>{svg}</Animated.View>;

  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Открыть гардероб" hitSlop={8}>{body}</Pressable>
    : body;
}

/** Accessory unlocked by level: 3 → headband, 5 → cloak, 10 → crown/aura */
export function accessoryForLevel(level: number): HeroOptions['accessory'] {
  if (level >= 10) return 'crown';
  if (level >= 5) return 'cloak';
  if (level >= 3) return 'headband';
  return 'none';
}

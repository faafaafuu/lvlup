import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { BODY_PATH, companionParts, CompanionOptions, FIXED } from './companionGeometry';

type Props = Partial<CompanionOptions> & {
  /** сторона квадрата в pt (viewBox 200×200) */
  size?: number;
  /** дыхание 3 с + моргание раз в 4–6 с — только на экране «Сегодня» */
  animated?: boolean;
  onPress?: () => void; // тап → гардероб
  accessibilityLabel?: string;
};

export function Companion({
  stage = 2, mood = 'idle', color = 'lime', crest = 'leaf', accessory = 'none',
  size = 200, animated = false, onPress, accessibilityLabel = 'Компаньон',
}: Props) {
  const p = useMemo(() => companionParts({ stage, mood, color, crest, accessory }), [stage, mood, color, crest, accessory]);
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const c = p.colors;

  const breath = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animated) return;
    let alive = true;
    let loop: Animated.CompositeAnimation | null = null;
    let t: ReturnType<typeof setTimeout>;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || !alive) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      loop.start();
      const next = () => { t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 150); next(); }, 4000 + Math.random() * 2000); };
      next();
    });
    return () => { alive = false; loop?.stop(); clearTimeout(t); };
  }, [animated, breath]);

  // scaleY 1 → 1.02 от линии земли (y = 188 из 200)
  const groundOffset = size * (188 / 200 - 0.5);
  const sy = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const sx = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.99] });
  const ty = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -groundOffset * 0.02] });

  const eyesScale = blink ? 0.1 : 1;

  const svg = (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Defs>
        <RadialGradient id={id('body')} cx="0.36" cy="0.28" r="0.82"><Stop offset="0" stopColor={c.hi} /><Stop offset="0.45" stopColor={c.mid} /><Stop offset="1" stopColor={c.lo} /></RadialGradient>
        <RadialGradient id={id('shade')} cx="0.42" cy="0.3" r="0.78"><Stop offset="0.62" stopColor={c.deep} stopOpacity={0} /><Stop offset="1" stopColor={c.deep} stopOpacity={0.55} /></RadialGradient>
        <LinearGradient id={id('limb')} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.mid} /><Stop offset="1" stopColor={c.lo} /></LinearGradient>
        <LinearGradient id={id('foot')} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.lo} /><Stop offset="1" stopColor={c.deep} /></LinearGradient>
        <LinearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} /><Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></LinearGradient>
        <RadialGradient id={id('cheek')} cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor={FIXED.cheek} stopOpacity={0.6} /><Stop offset="1" stopColor={FIXED.cheek} stopOpacity={0} /></RadialGradient>
        <RadialGradient id={id('ground')} cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor="#000" stopOpacity={0.38} /><Stop offset="1" stopColor="#000" stopOpacity={0} /></RadialGradient>
        <RadialGradient id={id('aura')} cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor="#E4FF6B" stopOpacity={0.55} /><Stop offset="0.55" stopColor={FIXED.aura} stopOpacity={0.16} /><Stop offset="1" stopColor={FIXED.aura} stopOpacity={0} /></RadialGradient>
        <LinearGradient id={id('crest')} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={p.crestColors.hi} /><Stop offset="1" stopColor={p.crestColors.lo} /></LinearGradient>
        <LinearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={FIXED.gold[0]} /><Stop offset="1" stopColor={FIXED.gold[1]} /></LinearGradient>
        <LinearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={FIXED.band[0]} /><Stop offset="1" stopColor={FIXED.band[1]} /></LinearGradient>
        <LinearGradient id={id('scarf')} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={FIXED.scarf[0]} /><Stop offset="1" stopColor={FIXED.scarf[1]} /></LinearGradient>
      </Defs>

      {p.auraR > 0 && <G id="aura"><Circle cx={100} cy={112} r={p.auraR} fill={`url(#${id('aura')})`} /></G>}
      <G id="shadow"><Ellipse cx={100} cy={189} rx={p.shadowRx} ry={7} fill={`url(#${id('ground')})`} /></G>

      <G transform={p.stageTransform}>
        <G id="feet">
          <Ellipse cx={82} cy={182} rx={15} ry={8} fill={`url(#${id('foot')})`} />
          <Ellipse cx={118} cy={182} rx={15} ry={8} fill={`url(#${id('foot')})`} />
        </G>
        <G id="arms">
          {p.arms.map((a, i) => (
            <Ellipse key={i} cx={a.x} cy={a.y} rx={9.5} ry={15} rotation={a.r} origin={`${a.x}, ${a.y}`} fill={`url(#${id('limb')})`} />
          ))}
        </G>
        <G id="body">
          <Path d={BODY_PATH} fill={`url(#${id('body')})`} />
          <Path d={BODY_PATH} fill={`url(#${id('shade')})`} />
          <Ellipse cx={100} cy={166} rx={30} ry={14} fill={c.hi} fillOpacity={0.16} />
          <Ellipse cx={74} cy={86} rx={24} ry={12} rotation={-30} origin="74, 86" fill={`url(#${id('gloss')})`} />
          <Circle cx={56} cy={108} r={3.2} fill="#FFFFFF" fillOpacity={0.55} />
        </G>
        {!!p.scarf && <G id="collar"><Path d={p.scarf} fill={`url(#${id('scarf')})`} /></G>}
        <G id="face">
          <Ellipse cx={70} cy={136} rx={11} ry={7} fill={`url(#${id('cheek')})`} />
          <Ellipse cx={130} cy={136} rx={11} ry={7} fill={`url(#${id('cheek')})`} />
          {p.eyesOpen && (
            <G id="eyes" scaleY={eyesScale} originY={121}>
              <Ellipse cx={84} cy={121} rx={8.4} ry={10.6} fill={FIXED.ink} />
              <Ellipse cx={116} cy={121} rx={8.4} ry={10.6} fill={FIXED.ink} />
              <Circle cx={87.2} cy={116.2} r={3.4} fill="#FFFFFF" />
              <Circle cx={119.2} cy={116.2} r={3.4} fill="#FFFFFF" />
              <Circle cx={81.6} cy={126} r={1.6} fill="#FFFFFF" fillOpacity={0.8} />
              <Circle cx={113.6} cy={126} r={1.6} fill="#FFFFFF" fillOpacity={0.8} />
            </G>
          )}
          {!!p.eyesClosed && <Path d={p.eyesClosed} fill="none" stroke={FIXED.ink} strokeWidth={3.6} strokeLinecap="round" />}
          {!!p.mouthLine && <Path d={p.mouthLine} fill="none" stroke={FIXED.ink} strokeWidth={2.6} strokeLinecap="round" />}
          {!!p.mouthOpen && <Path d={p.mouthOpen} fill={FIXED.mouth} />}
          {!!p.mouthOpen && <Ellipse cx={100} cy={141.5} rx={3.4} ry={2.4} fill={FIXED.tongue} />}
        </G>
        <G id="crest" y={p.crestOffsetY}>
          {!!p.crest.stem && <Path d={p.crest.stem} fill="none" stroke={p.crestColors.lo} strokeWidth={3} strokeLinecap="round" />}
          <Path d={p.crest.path} fill={`url(#${id('crest')})`} />
          {!!p.crest.vein && crest === 'leaf' && <Path d={p.crest.vein} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" />}
        </G>
        <G id="accessory">
          {!!p.band && <Path d={p.band} fill={`url(#${id('band')})`} />}
          {!!p.crown && <Path d={p.crown} fill={`url(#${id('gold')})`} />}
          {!!p.crownGems && <Path d={p.crownGems} fill="#FFFFFF" fillOpacity={0.85} />}
        </G>
      </G>
    </Svg>
  );

  const body = animated
    ? <Animated.View style={{ transform: [{ translateY: ty }, { scaleY: sy }, { scaleX: sx }] }}>{svg}</Animated.View>
    : svg;

  return onPress
    ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${accessibilityLabel} — открыть гардероб`} hitSlop={8}>{body}</Pressable>
    : body;
}

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { SHOP_ITEMS, Sex } from '@levelup/domain';
import { AvatarLook } from '@/state/store';

/**
 * Герой во viewBox 0 0 200 300, слои как в дизайн-ТЗ: shadow → legs → body → outfit → arms →
 * head → face → hair → accessory. Когда придёт SVG от дизайна — меняется только этот файл.
 */
export interface AvatarProps {
  sex: Sex;
  look: AvatarLook;
  /** 0 — старт, 2 — подтянутый. На любой стадии герой довольный. */
  stage: 0 | 1 | 2;
  outfitId?: string;
  accessoryId?: string;
  pose?: 'idle' | 'cheer';
  size?: number;
  animated?: boolean;
}

const BODY_WIDTH = [76, 64, 54] as const;
const WAIST = [70, 56, 46] as const;

export function Avatar({ sex, look, stage, outfitId, accessoryId, pose = 'idle', size = 220, animated = true }: AvatarProps) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, breathe]);

  const outfit = SHOP_ITEMS.find((i) => i.id === outfitId)?.value ?? '#8A94A6';
  const accessory = SHOP_ITEMS.find((i) => i.id === accessoryId)?.value;
  const w = BODY_WIDTH[stage];
  const waist = WAIST[stage];
  const cx = 100;
  const shoulderY = 118;
  const hipY = 196;
  const torso = `M ${cx - w / 2} ${shoulderY + 8} Q ${cx - w / 2} ${shoulderY} ${cx - w / 2 + 10} ${shoulderY}
    L ${cx + w / 2 - 10} ${shoulderY} Q ${cx + w / 2} ${shoulderY} ${cx + w / 2} ${shoulderY + 8}
    Q ${cx + waist / 2 + 4} ${hipY - 30} ${cx + waist / 2} ${hipY} L ${cx - waist / 2} ${hipY}
    Q ${cx - waist / 2 - 4} ${hipY - 30} ${cx - w / 2} ${shoulderY + 8} Z`;
  const armUp = pose === 'cheer';
  const leftArm = armUp
    ? `M ${cx - w / 2 + 6} ${shoulderY + 10} L ${cx - w / 2 - 22} ${shoulderY - 42}`
    : `M ${cx - w / 2 + 4} ${shoulderY + 10} L ${cx - w / 2 - 6} ${hipY - 10}`;
  const rightArm = armUp
    ? `M ${cx + w / 2 - 6} ${shoulderY + 10} L ${cx + w / 2 + 22} ${shoulderY - 42}`
    : `M ${cx + w / 2 - 4} ${shoulderY + 10} L ${cx + w / 2 + 6} ${hipY - 10}`;
  const legGap = 10 + stage * -2;

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  return (
    <Animated.View style={{ width: size, height: size * 1.5, transform: [{ scaleY: scale }], transformOrigin: 'bottom' }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 300">
        <G id="shadow">
          <Ellipse cx={cx} cy={288} rx={50} ry={8} fill="#000" opacity={0.18} />
        </G>
        {accessory === 'cape' && (
          <G id="accessory-back">
            <Path d={`M ${cx - w / 2 + 4} ${shoulderY} L ${cx - w / 2 - 14} 250 L ${cx + w / 2 + 14} 250 L ${cx + w / 2 - 4} ${shoulderY} Z`} fill="#C0283C" />
          </G>
        )}
        <G id="legs">
          <Rect x={cx - legGap / 2 - 20} y={hipY - 6} width={20} height={84} rx={9} fill={look.skin} />
          <Rect x={cx + legGap / 2} y={hipY - 6} width={20} height={84} rx={9} fill={look.skin} />
        </G>
        <G id="outfit-bottom">
          <Path d={`M ${cx - waist / 2 - 2} ${hipY - 8} L ${cx + waist / 2 + 2} ${hipY - 8} L ${cx + waist / 2 + 4} ${hipY + 44} L ${cx + 3} ${hipY + 44} L ${cx} ${hipY + 14} L ${cx - 3} ${hipY + 44} L ${cx - waist / 2 - 4} ${hipY + 44} Z`} fill="#2B3350" />
          <Rect x={cx - legGap / 2 - 22} y={274} width={24} height={12} rx={6} fill="#1B1F2E" />
          <Rect x={cx + legGap / 2 - 2} y={274} width={24} height={12} rx={6} fill="#1B1F2E" />
        </G>
        <G id="arms">
          <Path d={leftArm} stroke={look.skin} strokeWidth={17} strokeLinecap="round" />
          <Path d={rightArm} stroke={look.skin} strokeWidth={17} strokeLinecap="round" />
        </G>
        <G id="body">
          <Path d={torso} fill={outfit} />
          {sex === 'female' && <Path d={`M ${cx - 16} ${shoulderY + 22} Q ${cx} ${shoulderY + 30} ${cx + 16} ${shoulderY + 22}`} stroke="#00000022" strokeWidth={3} fill="none" />}
          <Path d={`M ${cx - 12} ${shoulderY} Q ${cx} ${shoulderY + 12} ${cx + 12} ${shoulderY}`} fill={look.skin} />
        </G>
        <G id="head">
          <Rect x={cx - 8} y={shoulderY - 16} width={16} height={18} fill={look.skin} />
          <Circle cx={cx} cy={78} r={36} fill={look.skin} />
        </G>
        <G id="face">
          <Circle cx={cx - 12} cy={78} r={4} fill="#1B1F2E" />
          <Circle cx={cx + 12} cy={78} r={4} fill="#1B1F2E" />
          <Path d={`M ${cx - 10} 92 Q ${cx} ${pose === 'cheer' ? 104 : 100} ${cx + 10} 92`} stroke="#1B1F2E" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Circle cx={cx - 22} cy={90} r={5} fill="#FF7A7A" opacity={0.35} />
          <Circle cx={cx + 22} cy={90} r={5} fill="#FF7A7A" opacity={0.35} />
        </G>
        <G id="hair">{hair(sex, look.hair, look.hairColor, cx)}</G>
        {accessory && accessory !== 'cape' && <G id="accessory">{accessoryShape(accessory, cx)}</G>}
      </Svg>
    </Animated.View>
  );
}

function hair(sex: Sex, style: 0 | 1 | 2, color: string, cx: number) {
  if (sex === 'male') {
    if (style === 0) return <Path d={`M ${cx - 36} 74 Q ${cx - 38} 38 ${cx} 40 Q ${cx + 38} 38 ${cx + 36} 74 Q ${cx + 24} 52 ${cx} 56 Q ${cx - 24} 52 ${cx - 36} 74 Z`} fill={color} />;
    if (style === 1) return <Path d={`M ${cx - 37} 70 Q ${cx - 30} 30 ${cx + 6} 38 Q ${cx + 40} 40 ${cx + 37} 70 L ${cx + 20} 54 L ${cx + 4} 60 L ${cx - 12} 52 Z`} fill={color} />;
    return <Path d={`M ${cx - 34} 66 Q ${cx} 30 ${cx + 34} 66 Q ${cx} 50 ${cx - 34} 66 Z`} fill={color} />;
  }
  if (style === 0)
    return <Path d={`M ${cx - 38} 112 Q ${cx - 46} 40 ${cx} 38 Q ${cx + 46} 40 ${cx + 38} 112 L ${cx + 30} 112 Q ${cx + 32} 64 ${cx} 56 Q ${cx - 32} 64 ${cx - 30} 112 Z`} fill={color} />;
  if (style === 1)
    return (
      <G>
        <Circle cx={cx} cy={34} r={14} fill={color} />
        <Path d={`M ${cx - 37} 74 Q ${cx - 38} 40 ${cx} 42 Q ${cx + 38} 40 ${cx + 37} 74 Q ${cx + 20} 54 ${cx} 56 Q ${cx - 20} 54 ${cx - 37} 74 Z`} fill={color} />
      </G>
    );
  return <Path d={`M ${cx - 38} 92 Q ${cx - 44} 38 ${cx} 40 Q ${cx + 44} 38 ${cx + 38} 92 Q ${cx + 30} 60 ${cx} 58 Q ${cx - 30} 60 ${cx - 38} 92 Z`} fill={color} />;
}

function accessoryShape(kind: string, cx: number) {
  switch (kind) {
    case 'headband':
      return <Rect x={cx - 37} y={56} width={74} height={9} rx={4} fill="#E5484D" />;
    case 'crown':
      return <Path d={`M ${cx - 26} 46 L ${cx - 26} 22 L ${cx - 13} 34 L ${cx} 16 L ${cx + 13} 34 L ${cx + 26} 22 L ${cx + 26} 46 Z`} fill="#FFC83D" stroke="#C9952A" strokeWidth={2} />;
    case 'glasses':
      return (
        <G>
          <Circle cx={cx - 12} cy={78} r={9} stroke="#1B1F2E" strokeWidth={3} fill="#FFFFFF33" />
          <Circle cx={cx + 12} cy={78} r={9} stroke="#1B1F2E" strokeWidth={3} fill="#FFFFFF33" />
          <Path d={`M ${cx - 3} 78 L ${cx + 3} 78`} stroke="#1B1F2E" strokeWidth={3} />
        </G>
      );
    default:
      return null;
  }
}

export const SKIN_TONES = ['#F5D0B5', '#E8B48F', '#C98E66', '#9C6644', '#6B4430'];
export const HAIR_COLORS = ['#1F1A17', '#3B2A20', '#8A5A2B', '#D9A55B', '#B0412E'];

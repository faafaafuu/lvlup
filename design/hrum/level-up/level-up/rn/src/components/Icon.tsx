import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ICONS, IconName } from './icons';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  /** активная вкладка: сплошная заливка тем же цветом */
  filled?: boolean;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color, filled = false, strokeWidth = 1.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={ICONS[name]} />
    </Svg>
  );
}

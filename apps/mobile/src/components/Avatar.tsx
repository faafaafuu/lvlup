import { SHOP_ITEMS, Sex } from '@levelup/domain';
import { Hero } from '@/design/hero/Hero';
import { Accessory, PALETTE } from '@/design/hero/heroGeometry';
import { AvatarLook } from '@/state/store';

/** Адаптер: данные приложения (пол, внешность, надетые предметы) → герой из дизайн-хендоффа. */
export interface AvatarProps {
  sex: Sex;
  look: AvatarLook;
  stage: 0 | 1 | 2;
  outfitId?: string;
  accessoryId?: string;
  pose?: 'idle' | 'cheer' | 'wave';
  size?: number;
  animated?: boolean;
  onPress?: () => void;
}

const ACCESSORIES: ReadonlySet<string> = new Set(['headband', 'cloak', 'crown']);

export function Avatar({ sex, look, stage, outfitId, accessoryId, pose = 'idle', size = 200, animated = false, onPress }: AvatarProps) {
  const outfit = SHOP_ITEMS.find((i) => i.id === outfitId)?.value ?? PALETTE.outfit[5];
  const acc = SHOP_ITEMS.find((i) => i.id === accessoryId)?.value;
  const accessory = (acc && ACCESSORIES.has(acc) ? acc : 'none') as Accessory;
  return (
    <Hero
      gender={sex === 'male' ? 'm' : 'f'}
      stage={stage}
      pose={pose}
      hair={look.hair}
      accessory={accessory}
      colors={{ skin: look.skin, outfitTop: outfit, hair: look.hairColor }}
      size={size}
      animated={animated}
      onPress={onPress}
    />
  );
}

export const SKIN_TONES = PALETTE.skin;
export const HAIR_COLORS = PALETTE.hair;

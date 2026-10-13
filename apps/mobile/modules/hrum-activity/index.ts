import { requireOptionalNativeModule } from 'expo-modules-core';

type Native = {
  isSupported(): boolean;
  show(kcalLeft: number, food: number, steps: number, xp: number, listening: boolean): Promise<void>;
  end(): Promise<void>;
};

/** Нативный модуль Live Activity; в Expo Go и на Android его нет — тогда null. */
export const HrumActivity = requireOptionalNativeModule<Native>('HrumActivity');

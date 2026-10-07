import * as Haptics from 'expo-haptics';

export const tap = () => void Haptics.selectionAsync().catch(() => {});
export const success = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const heavy = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/design/components';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

export function AppToast() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useStore((s) => s.toast);
  const hide = useStore((s) => s.hideToast);
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, zIndex: 10 }}>
      <Toast key={toast.id} t={t} kind={toast.kind} title={toast.title} subtitle={toast.subtitle} onHide={hide} />
    </View>
  );
}

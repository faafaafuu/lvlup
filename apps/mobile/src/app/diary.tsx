import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/state/store';

/** levelup://diary — раздел главного экрана. */
export default function Open() {
  useEffect(() => {
    useStore.getState().setPage(0);
    router.replace('/');
  }, []);
  return <View />;
}

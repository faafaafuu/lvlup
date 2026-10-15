import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/state/store';

/** levelup://progress — раздел главного экрана. */
export default function Open() {
  useEffect(() => {
    useStore.getState().setPage(2);
    router.replace('/');
  }, []);
  return <View />;
}

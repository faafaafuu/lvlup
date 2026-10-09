/**
 * Плавающий стеклянный таб-бар (стиль iOS 26) + круглая кнопка микрофона справа.
 * Микрофон доступен с любой вкладки — запись за 10 секунд откуда угодно.
 * Стекло: expo-blur. На iOS 26 можно заменить BlurView на GlassView из expo-glass-effect.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { IconName } from './icons';
import { MicButton } from './ui';
import { Theme } from '../theme';

export type TabId = 'today' | 'diary' | 'progress' | 'rewards';
const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Сегодня', icon: 'tabToday' },
  { id: 'diary', label: 'Дневник', icon: 'tabDiary' },
  { id: 'progress', label: 'Прогресс', icon: 'tabProgress' },
  { id: 'rewards', label: 'Награды', icon: 'tabRewards' },
];

export function TabBar({ t, active, onChange, onMic, recording }: {
  t: Theme; active: TabId; onChange: (id: TabId) => void; onMic: () => void; recording?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const activeColor = t.name === 'dark' ? '#D4FF3A' : '#111113';
  return (
    <View style={[s.wrap, { bottom: Math.max(insets.bottom - 8, 12) }]} pointerEvents="box-none">
      <View style={[s.glassShadow]}>
        <BlurView intensity={60} tint={t.blurTint} style={[s.glass, { backgroundColor: t.c.glass, borderColor: t.name === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
          {TABS.map((tab) => {
            const on = tab.id === active;
            return (
              <Pressable
                key={tab.id}
                onPress={() => { Haptics.selectionAsync(); onChange(tab.id); }}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: on }}
                style={[s.tab, on && { backgroundColor: t.name === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(17,17,19,0.06)' }]}
              >
                <Icon name={tab.icon} size={24} color={on ? activeColor : t.c.textMuted} filled={on} />
                <Text style={[s.label, { color: on ? activeColor : t.c.textMuted }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
      <MicButton t={t} onPress={onMic} recording={recording} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glassShadow: { flex: 1, borderRadius: 32, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
  glass: { height: 64, borderRadius: 32, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, borderWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '600' },
});

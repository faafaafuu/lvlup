/**
 * Level Up — base components (React Native / Expo, StyleSheet + react-native-svg).
 * Every component supports: default / pressed / disabled / loading.
 */
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Easing, Modal as RNModal, Pressable, StyleSheet, Text, View, ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { IconName } from './icons';
import { fonts, radius, size, Theme } from './theme';

type Base = { t: Theme; disabled?: boolean; loading?: boolean; style?: ViewStyle };

/* ───────────────────────── Button ───────────────────────── */
export function Button({ t, title, onPress, variant = 'primary', disabled, loading, style }: Base & {
  title: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'danger';
}) {
  const c = t.c;
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && { backgroundColor: pressed ? c.primaryPressed : c.primary },
        variant === 'danger' && { backgroundColor: c.danger },
        variant === 'secondary' && { backgroundColor: pressed ? c.pressed : 'transparent', borderWidth: 1, borderColor: c.border, height: 48 },
        disabled && { backgroundColor: variant === 'secondary' ? 'transparent' : c.surfaceAlt },
        pressed && !inactive && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'secondary' ? c.text : c.onPrimary} />
        : <Text style={[s.btnText, { color: disabled ? c.disabledText : variant === 'secondary' ? c.text : variant === 'danger' ? (t.name === 'dark' ? '#2A0A0A' : '#FFFFFF') : c.onPrimary }]}>{title}</Text>}
    </Pressable>
  );
}

/* ───────────────────────── MicButton ───────────────────────── */
export function MicButton({ t, recording = false, onPress, disabled, loading }: Base & { recording?: boolean; onPress?: () => void }) {
  const c = t.c;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!recording) { pulse.stopAnimation(); pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);
  const ring = (offset: number) => {
    const v = Animated.modulo(Animated.add(pulse, offset), 1);
    return {
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0] }),
    };
  };
  return (
    <View style={s.micWrap}>
      {recording && <Animated.View style={[s.micRing, { backgroundColor: c.primary }, ring(0)]} />}
      {recording && <Animated.View style={[s.micRing, { backgroundColor: c.primary }, ring(0.5)]} />}
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Остановить запись' : 'Записать голосом'}
        style={({ pressed }) => [
          s.mic,
          { backgroundColor: disabled ? c.surfaceAlt : pressed || recording ? c.primaryPressed : c.primary },
          !disabled && t.shadow.glow,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
      >
        {loading ? <ActivityIndicator color={c.onPrimary} /> : <Icon name="mic" size={34} strokeWidth={2.4} color={disabled ? c.disabledText : c.onPrimary} />}
      </Pressable>
    </View>
  );
}

/* ───────────────────────── XPBar ───────────────────────── */
export function XPBar({ t, value, max, loading }: Base & { value: number; max: number }) {
  const c = t.c;
  const w = useRef(new Animated.Value(value / max)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: Math.min(1, value / max), duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: false }).start();
  }, [value, max, w]);
  return (
    <View style={s.row} accessibilityRole="progressbar" accessibilityLabel="Опыт" accessibilityValue={{ min: 0, max, now: value }}>
      <View style={[s.xpTrack, { backgroundColor: c.track }]}>
        {!loading && <Animated.View style={[s.xpFill, { backgroundColor: c.xp, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />}
      </View>
      <Text style={[s.caption, { color: c.textMuted }]}>{loading ? '…' : `${value} / ${max} XP`}</Text>
    </View>
  );
}

/** «+10 XP» floats up and fades (900 ms). Mount it with a new key each time XP is granted. */
export function XPFloat({ t, amount }: { t: Theme; amount: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [v]);
  return (
    <Animated.Text style={[s.xpFloat, { color: t.c.xp, opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }] }]}>
      +{amount} XP
    </Animated.Text>
  );
}

/* ───────────────────────── LevelBadge ───────────────────────── */
export function LevelBadge({ t, level, onPress }: { t: Theme; level: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={`Уровень ${level}`} style={({ pressed }) => [s.badge, { backgroundColor: pressed ? t.c.primaryPressed : t.c.primary }, t.shadow.glow, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Text style={[s.badgeText, { color: t.c.onPrimary }]}>{level}</Text>
    </Pressable>
  );
}

/* ───────────────────────── TemplateChip ───────────────────────── */
export function TemplateChip({ t, name, kcal, onPress, disabled, loading }: Base & { name: string; kcal: number; onPress?: () => void }) {
  const c = t.c;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={`Записать: ${name}, ${kcal} ккал`}
      style={({ pressed }) => [s.chip, { backgroundColor: pressed ? c.pressed : c.surface, borderColor: pressed ? c.primary : c.border }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      {loading && <ActivityIndicator size="small" color={c.text} />}
      <Text style={[s.chipText, { color: disabled ? c.disabledText : c.text }]}>{name}</Text>
      <Text style={[s.chipKcal, { color: c.textMuted }]}>· {kcal}</Text>
    </Pressable>
  );
}

/* ───────────────────────── QuestCard ───────────────────────── */
export function QuestCard({ t, icon, title, current, target, unit = '', xp, manual, onPress, disabled, loading }: Base & {
  icon: IconName; title: string; current: number; target: number; unit?: string; xp: number; manual?: boolean; onPress?: () => void;
}) {
  const c = t.c;
  const done = current >= target;
  const pct = Math.min(1, current / target);
  if (loading) {
    return (
      <View style={[s.quest, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[s.skel, { width: 32, height: 32, backgroundColor: c.track }]} />
        <View style={{ flex: 1, gap: 6 }}><View style={[s.skel, { width: '60%', backgroundColor: c.track }]} /><View style={[s.skel, { height: 4, backgroundColor: c.track }]} /></View>
      </View>
    );
  }
  const fmt = (n: number) => n.toLocaleString('ru-RU');
  const label = manual
    ? `${title}: ${done ? 'выполнено' : 'не выполнено'}. Награда ${xp} XP`
    : `${title}: ${fmt(current)} из ${fmt(target)}${unit}. Награда ${xp} XP`;
  return (
    <Pressable onPress={onPress} disabled={disabled || !onPress} accessibilityLabel={label} accessibilityRole={manual ? 'checkbox' : undefined} accessibilityState={manual ? { checked: done } : undefined}
      style={({ pressed }) => [s.quest, { backgroundColor: pressed ? c.pressed : c.surface, borderColor: done ? c.success : c.border, opacity: disabled ? 0.6 : 1 }, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={[s.questIcon, { backgroundColor: done ? c.successSoft : c.primarySoft }]}>
        <Icon name={done ? 'check' : icon} size={18} color={done ? c.success : c.primary} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[s.questTitle, { color: c.text }]} numberOfLines={2}>{title}</Text>
        {manual ? (
          <Text style={[s.caption, { color: done ? c.success : c.textMuted }]}>{done ? 'Готово' : 'Нажми, когда сделаешь'}</Text>
        ) : (
          <View style={s.row}>
            <View style={[s.questTrack, { backgroundColor: c.track, flex: 1 }]}>
              <View style={{ width: `${pct * 100}%`, height: 4, backgroundColor: done ? c.success : c.primary }} />
            </View>
            <Text style={[s.caption, { color: c.textMuted }]}>{fmt(current)} / {fmt(target)}{unit}</Text>
          </View>
        )}
      </View>
      <Text style={[s.questXp, { color: c.xp }]}>+{xp} XP</Text>
    </Pressable>
  );
}

/* ───────────────────────── ConfirmItem ───────────────────────── */
export function ConfirmItem({ t, name, portion, grams, unit = 'г', kcal, approx, onMinus, onPlus, disabled, loading }: Base & {
  name: string; portion: string; grams: number; unit?: string; kcal: number; approx?: boolean; onMinus?: () => void; onPlus?: () => void;
}) {
  const c = t.c;
  if (loading) {
    return <View style={[s.item, { backgroundColor: c.surfaceAlt, gap: 10 }]}><View style={[s.skel, { width: '70%', backgroundColor: c.track }]} /><View style={[s.skel, { width: '40%', backgroundColor: c.track }]} /></View>;
  }
  const Step = ({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label: string }) => (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={4} style={s.stepHit}>
      {({ pressed }) => <View style={[s.stepBox, { backgroundColor: pressed ? c.track : c.surface }]}><Icon name={icon} size={18} color={c.text} /></View>}
    </Pressable>
  );
  return (
    <View style={[s.item, { backgroundColor: c.surfaceAlt, opacity: disabled ? 0.45 : 1 }]}>
      <View style={[s.rowBetween, { paddingRight: 8 }]}>
        <View style={[s.row, { flex: 1 }]}>
          <Text style={[s.itemName, { color: c.text }]}>{name}</Text>
          {approx && <View style={[s.approx, { backgroundColor: c.warningSoft }]} accessibilityLabel="количество угадано"><Text style={{ color: c.warning, fontWeight: '700', fontSize: 13 }}>≈ угадал</Text></View>}
        </View>
        <Text style={[s.itemName, { color: c.text, fontVariant: ['tabular-nums'] }]}>{kcal}</Text>
      </View>
      <View style={s.rowBetween}>
        <Text style={{ color: c.textMuted, fontSize: size.sm }}>{portion}</Text>
        <View style={s.row}>
          <Step icon="minus" onPress={onMinus} label="Меньше" />
          <Text style={[s.grams, { color: c.text }]}>{grams} {unit}</Text>
          <Step icon="plus" onPress={onPlus} label="Больше" />
        </View>
      </View>
    </View>
  );
}

/* ───────────────────────── Toast ───────────────────────── */
export function Toast({ t, kind = 'saved', title, subtitle, reward, coins, onHide }: {
  t: Theme; kind?: 'saved' | 'quest' | 'achievement' | 'offline'; title: string; subtitle?: string; reward?: number; coins?: number; onHide?: () => void;
}) {
  const c = t.c;
  const y = useRef(new Animated.Value(-80)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(y, { toValue: 0, damping: 18, stiffness: 240, useNativeDriver: true }),
      Animated.delay(kind === 'achievement' ? 3000 : 2500),
      Animated.timing(y, { toValue: -80, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onHide?.());
  }, [kind, y, onHide]);
  const xpOnToast = t.name === 'dark' ? '#0A75B5' : '#5CC8FF';
  const coinOnToast = t.name === 'dark' ? '#8F6200' : '#FFC845';
  return (
    <Animated.View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[s.toast, { backgroundColor: c.toastBg, transform: [{ translateY: y }] }]}>
      <View style={[s.toastIcon, { backgroundColor: kind === 'achievement' ? '#F5B83D' : kind === 'offline' ? c.textMuted : c.success }]}>
        <Icon name={kind === 'achievement' ? 'medal' : kind === 'offline' ? 'cloudOff' : 'check'} size={18} strokeWidth={2.4} color={kind === 'achievement' ? '#3B2400' : c.onPrimary === '#FFFFFF' ? '#FFFFFF' : '#06281A'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.toastTitle, { color: c.toastText }]}>{title}</Text>
        {!!subtitle && <Text style={{ color: c.toastText, opacity: 0.75, fontSize: 13 }}>{subtitle}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {!!reward && <Text style={[s.toastReward, { color: xpOnToast }]}>+{reward} XP</Text>}
        {!!coins && <Text style={[s.toastReward, { color: coinOnToast }]}>+{coins} монет</Text>}
      </View>
    </Animated.View>
  );
}

/* ───────────────────────── RewardModal (level-up / chest) ───────────────────────── */
export function RewardModal({ t, visible, title, subtitle, cta, onClose, children, loading }: {
  t: Theme; visible: boolean; title: string; subtitle?: string; cta: string; onClose: () => void; children?: React.ReactNode; loading?: boolean;
}) {
  const c = t.c;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) { pop.setValue(0); Animated.spring(pop, { toValue: 1, damping: 9, stiffness: 180, delay: 150, useNativeDriver: true }).start(); }
  }, [visible, pop]);
  return (
    <RNModal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* Tap anywhere closes: never blocks input > 1.5 s */}
      <Pressable style={[s.modal, { backgroundColor: c.bg }]} onPress={onClose} accessibilityLabel="Закрыть">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {children}
          {loading ? <ActivityIndicator color={c.primary} /> : (
            <Animated.Text style={[s.modalTitle, { color: c.primary, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>{title}</Animated.Text>
          )}
          {!!subtitle && <Text style={{ color: c.text, fontSize: 17 }}>{subtitle}</Text>}
        </View>
        <Button t={t} title={cta} onPress={onClose} />
      </Pressable>
    </RNModal>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caption: { fontSize: size.xs, fontWeight: '600', fontVariant: ['tabular-nums'] },
  btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  btnText: { fontSize: 17, fontWeight: '600' },
  micWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38 },
  xpTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: 8, borderRadius: 4 },
  xpFloat: { position: 'absolute', right: 16, fontFamily: fonts.display, fontSize: 18 },
  badge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.display, fontSize: 20 },
  chip: { height: 44, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: size.sm, fontWeight: '600' },
  chipKcal: { fontSize: size.sm },
  quest: { minHeight: 60, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  questIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questTitle: { fontSize: 15, fontWeight: '600' },
  questTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  questXp: { fontSize: size.xs, fontWeight: '700' },
  skel: { height: 10, borderRadius: 5 },
  item: { borderRadius: 16, paddingTop: 10, paddingBottom: 6, paddingLeft: 14, paddingRight: 6, gap: 2 },
  itemName: { fontSize: size.md, fontWeight: '600' },
  approx: { height: 22, paddingHorizontal: 7, borderRadius: 6, justifyContent: 'center' },
  stepHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  grams: { minWidth: 52, textAlign: 'center', fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  toast: { position: 'absolute', top: 59, left: 16, right: 16, minHeight: 60, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  toastIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toastTitle: { fontSize: 15, fontWeight: '600' },
  toastReward: { fontSize: 15, fontWeight: '700' },
  modal: { flex: 1, paddingHorizontal: 16, paddingTop: 59, paddingBottom: 50 },
  modalTitle: { fontFamily: fonts.display, fontSize: size.xxl, textAlign: 'center' },
});

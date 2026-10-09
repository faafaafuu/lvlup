/**
 * Level Up — базовые компоненты (React Native / Expo, StyleSheet + react-native-svg).
 * Состояния у каждого: default / pressed / disabled / loading.
 */
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { IconName } from './icons';
import { fonts, size, Theme } from './theme';

type Base = { t: Theme; disabled?: boolean; loading?: boolean; style?: ViewStyle };

/* ───────── Button: primary / secondary / destructive, pill 56 ───────── */
export function Button({ t, title, onPress, variant = 'primary', disabled, loading, style }: Base & {
  title: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'destructive';
}) {
  const c = t.c;
  const bg = (pressed: boolean) => {
    if (disabled) return c.btnDisabled;
    if (variant === 'primary') return pressed ? c.btnPressed : c.btn;
    if (variant === 'destructive') return '#CC2F35';
    return pressed ? c.fillPressed : c.fill;
  };
  const fg = disabled ? c.onBtnDisabled : variant === 'primary' ? c.onBtn : variant === 'destructive' ? '#FFFFFF' : c.text;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [s.btn, { backgroundColor: bg(pressed) }, pressed && !disabled && { transform: [{ scale: 0.97 }] }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

/* ───────── MicButton: 64, живёт справа от таб-бара ───────── */
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
    return { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }], opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] }) };
  };
  return (
    <View style={s.micWrap}>
      {recording && <Animated.View style={[s.micRing, { backgroundColor: c.btn }, ring(0)]} />}
      {recording && <Animated.View style={[s.micRing, { backgroundColor: c.btn }, ring(0.5)]} />}
      <Pressable
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Остановить запись' : 'Записать голосом'}
        style={({ pressed }) => [s.mic, { backgroundColor: disabled ? c.btnDisabled : pressed ? c.btnPressed : c.btn }, !disabled && t.shadow.glow, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        {loading ? <ActivityIndicator color={c.onBtn} /> : <Icon name="mic" size={28} strokeWidth={2.2} color={disabled ? c.onBtnDisabled : c.onBtn} />}
      </Pressable>
    </View>
  );
}

/* ───────── Ring: прогресс-кольцо (уровень, квест, день недели) ───────── */
export function Ring({ t, value, size: d = 44, stroke = 3.5, color, fill = 'none', children }: {
  t: Theme; value: number; size?: number; stroke?: number; color?: string; fill?: string; children?: React.ReactNode;
}) {
  const r = (d - stroke) / 2;
  const C = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: d, height: d, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={d} height={d} style={StyleSheet.absoluteFill}>
        <Circle cx={d / 2} cy={d / 2} r={r} fill={fill} stroke={t.c.track} strokeWidth={stroke} />
        {v > 0 && <Circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={color ?? t.c.ring} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${C * v} ${C}`} rotation={-90} origin={`${d / 2}, ${d / 2}`} />}
      </Svg>
      {children}
    </View>
  );
}

/** Уровень в шапке: кольцо XP 44 + цифра. Доливается за 600 мс. */
export function LevelRing({ t, level, xp, xpMax, onPress }: { t: Theme; level: number; xp: number; xpMax: number; onPress?: () => void }) {
  const anim = useRef(new Animated.Value(xp / xpMax)).current;
  const [v, setV] = React.useState(xp / xpMax);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setV(value));
    Animated.timing(anim, { toValue: xp / xpMax, duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [xp, xpMax, anim]);
  return (
    <Pressable onPress={onPress} accessibilityLabel={`Уровень ${level}, ${xp} из ${xpMax} XP`} hitSlop={4}>
      <Ring t={t} value={v}><Text style={[s.level, { color: t.c.text }]}>{level}</Text></Ring>
    </Pressable>
  );
}

/** «+10 XP» всплывает и тает (900 мс). Монтировать с новым key на каждое начисление. */
export function XPFloat({ t, amount }: { t: Theme; amount: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [v]);
  return (
    <Animated.Text style={[s.xpFloat, { color: t.c.accentText, opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) }] }]}>
      +{amount} XP
    </Animated.Text>
  );
}

/* ───────── TemplateChip: 44, pill ───────── */
export function TemplateChip({ t, name, kcal, onPress, disabled, loading }: Base & { name: string; kcal: number; onPress?: () => void }) {
  const c = t.c;
  const muted = disabled ? c.onBtnDisabled : c.textMuted;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={`Записать: ${name}, ${kcal} ккал`}
      style={({ pressed }) => [s.chip, { backgroundColor: pressed ? c.fillPressed : c.surface }, pressed && { transform: [{ scale: 0.97 }] }]}>
      {loading ? <ActivityIndicator size="small" color={c.text} /> : <Icon name="plus" size={16} strokeWidth={2} color={muted} />}
      <Text style={[s.chipText, { color: disabled ? c.onBtnDisabled : c.text }]}>{name}</Text>
      <Text style={[s.chipText, { color: muted, fontWeight: '400' }]}>{kcal}</Text>
    </Pressable>
  );
}

/* ───────── QuestRow: 62, кольцо 36 ───────── */
export function QuestRow({ t, icon, title, progressText, value, xp, onPress, disabled, loading, first }: Base & {
  icon: IconName; title: string; progressText: string; value: number; xp: number; onPress?: () => void; first?: boolean;
}) {
  const c = t.c;
  const done = value >= 1;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityLabel={`${title}: ${progressText}. Награда ${xp} XP`}
      style={({ pressed }) => [s.quest, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.sep }, pressed && { backgroundColor: c.fillPressed }, disabled && { opacity: 0.6 }]}>
      <Ring t={t} value={loading ? 0 : value} size={36} stroke={3} fill={done ? c.doneFill : 'none'}>
        {!loading && <Icon name={done ? 'check' : icon} size={16} strokeWidth={2} color={c.text} />}
      </Ring>
      <View style={{ flex: 1, gap: 2 }}>
        {loading ? <View style={[s.skel, { width: '60%', backgroundColor: c.track }]} /> : <Text style={[s.questTitle, { color: c.text }]}>{title}</Text>}
        {loading ? <View style={[s.skel, { width: '35%', height: 8, backgroundColor: c.track }]} /> : <Text style={[s.caption, { color: c.textMuted }]}>{progressText}</Text>}
      </View>
      {!loading && <Text style={[s.reward, { color: done ? c.textMuted : c.accentText }]}>+{xp} XP</Text>}
    </Pressable>
  );
}

/* ───────── ConfirmItem: строка в шите «Записываю» ───────── */
export function ConfirmItem({ t, name, portion, amount, kcal, approx, onMinus, onPlus, disabled, loading, first }: Base & {
  name: string; portion: string; amount: string; kcal: number; approx?: boolean; onMinus?: () => void; onPlus?: () => void; first?: boolean;
}) {
  const c = t.c;
  if (loading) {
    return <View style={[s.item, { gap: 10 }]}><View style={[s.skel, { width: '70%', backgroundColor: c.track }]} /><View style={[s.skel, { width: '40%', backgroundColor: c.track }]} /></View>;
  }
  const Step = ({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label: string }) => (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={s.stepHit} hitSlop={4}>
      <Icon name={icon} size={16} strokeWidth={2.2} color={c.text} />
    </Pressable>
  );
  return (
    <View style={[s.item, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.sep }, disabled && { opacity: 0.45 }]}>
      <View style={s.rowBetween}>
        <View style={[s.row, { flex: 1 }]}>
          <Text style={[s.itemName, { color: c.text }]}>{name}</Text>
          {approx && <View style={[s.pill, { backgroundColor: c.fill }]} accessibilityLabel="количество на глаз"><Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>≈ на глаз</Text></View>}
        </View>
        <Text style={[s.itemName, { color: c.text, fontVariant: ['tabular-nums'] }]}>{kcal}</Text>
      </View>
      <View style={s.rowBetween}>
        <Text style={{ color: c.textMuted, fontSize: size.sm }}>{portion}</Text>
        <View style={[s.stepper, { backgroundColor: c.fill }]}>
          <Step icon="minus" onPress={onMinus} label="Меньше" />
          <Text style={[s.amount, { color: c.text }]}>{amount}</Text>
          <Step icon="plus" onPress={onPlus} label="Больше" />
        </View>
      </View>
    </View>
  );
}

/* ───────── Toast: pill 60, выезжает из-под Dynamic Island ───────── */
export function Toast({ t, kind = 'saved', title, subtitle, reward, onHide }: {
  t: Theme; kind?: 'saved' | 'quest' | 'achievement' | 'offline'; title: string; subtitle?: string; reward?: string; onHide?: () => void;
}) {
  const c = t.c;
  const y = useRef(new Animated.Value(-90)).current;
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(y, { toValue: 0, damping: 18, stiffness: 240, useNativeDriver: true }),
      Animated.delay(kind === 'achievement' ? 3000 : 2500),
      Animated.timing(y, { toValue: -90, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start(() => onHide?.());
  }, [kind, y, onHide]);
  const iconBg = kind === 'offline' ? c.fill : kind === 'achievement' ? '#F2B33A' : '#D4FF3A';
  const iconName: IconName = kind === 'offline' ? 'cloudOff' : kind === 'achievement' ? 'streak' : kind === 'quest' ? 'quest' : 'check';
  return (
    <Animated.View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[s.toast, { backgroundColor: c.toastBg, transform: [{ translateY: y }] }]}>
      <View style={[s.toastIcon, { backgroundColor: iconBg }]}><Icon name={iconName} size={20} strokeWidth={2.4} color={kind === 'offline' ? c.toastText : '#0C0C0E'} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[s.toastTitle, { color: c.toastText }]}>{title}</Text>
        {!!subtitle && <Text style={{ color: c.toastText, opacity: 0.6, fontSize: 13 }}>{subtitle}</Text>}
      </View>
      {!!reward && <Text style={[s.toastReward, { color: c.toastText }]}>{reward}</Text>}
    </Animated.View>
  );
}

/* ───────── Segmented: pill 36 ───────── */
export function Segmented({ t, items, value, onChange }: { t: Theme; items: string[]; value: number; onChange: (i: number) => void }) {
  const c = t.c;
  return (
    <View accessibilityRole="tablist" style={[s.seg, { backgroundColor: c.fill }]}>
      {items.map((x, i) => (
        <Pressable key={x} onPress={() => { Haptics.selectionAsync(); onChange(i); }} accessibilityRole="tab" accessibilityState={{ selected: i === value }}
          style={[s.segItem, i === value && [{ backgroundColor: c.segOn }, t.shadow.card]]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: i === value ? c.text : c.textMuted }}>{x}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caption: { fontSize: 13, fontVariant: ['tabular-nums'] },
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  btnText: { fontSize: 17, fontWeight: '600' },
  micWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: 64, height: 64, borderRadius: 32 },
  level: { fontFamily: fonts.displayBold, fontSize: 17 },
  xpFloat: { position: 'absolute', fontFamily: fonts.display, fontSize: 18 },
  chip: { height: 44, borderRadius: 22, paddingLeft: 12, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 15, fontWeight: '500' },
  quest: { height: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  questTitle: { fontSize: 15, fontWeight: '500' },
  reward: { fontSize: 13, fontWeight: '600' },
  skel: { height: 10, borderRadius: 5 },
  item: { paddingTop: 12, paddingBottom: 10, paddingLeft: 16, paddingRight: 10, gap: 4 },
  itemName: { fontSize: size.md, fontWeight: '600' },
  pill: { height: 20, paddingHorizontal: 7, borderRadius: 10, justifyContent: 'center' },
  stepper: { height: 36, borderRadius: 18, flexDirection: 'row', alignItems: 'center' },
  stepHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  amount: { minWidth: 54, textAlign: 'center', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  toast: { position: 'absolute', top: 56, left: 16, right: 16, height: 60, borderRadius: 30, paddingLeft: 10, paddingRight: 18, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  toastIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toastTitle: { fontSize: 15, fontWeight: '600' },
  toastReward: { fontFamily: fonts.display, fontSize: 17 },
  seg: { height: 36, borderRadius: 18, padding: 2, flexDirection: 'row' },
  segItem: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Switch, Text, TextProps, TextStyle, View, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, RadialGradient, Stop } from 'react-native-svg';
import { Icon } from '@/design/Icon';
import { IconName } from '@/design/icons';
import { tap } from '@/lib/haptics';
import { FONT, useTheme } from './theme';

/* ───── Типографика: Unbounded для чисел, JetBrains Mono для подписей, SF для текста ───── */

/** Подпись капслоком моноширинным: «ККАЛ ОСТАЛОСЬ», «ЗАВТРАК». */
export function Lbl({ style, children, color, ...rest }: TextProps & { color?: string }) {
  const t = useTheme();
  return (
    <Text {...rest} style={[{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.6, color: color ?? t.mu, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

/** Число шрифтом Unbounded: тонкое для крупных (200), обычное для мелких (300). */
export function Num({ size = 20, weight, style, color, children, ...rest }: TextProps & { size?: number; weight?: 200 | 300 | 400; color?: string }) {
  const t = useTheme();
  const w = weight ?? (size >= 40 ? 200 : 300);
  const family = w === 200 ? FONT.num200 : w === 300 ? FONT.num300 : FONT.num400;
  return (
    <Text {...rest} style={[{ fontFamily: family, fontSize: size, color: color ?? t.tx, fontVariant: ['tabular-nums'], letterSpacing: size >= 40 ? -1 : 0 }, style]}>
      {children}
    </Text>
  );
}

export function Txt({ size = 17, weight = '400', muted, style, color, ...rest }: TextProps & { size?: number; weight?: TextStyle['fontWeight']; muted?: boolean; color?: string }) {
  const t = useTheme();
  return <Text {...rest} style={[{ fontSize: size, fontWeight: weight, color: color ?? (muted ? t.mu : t.tx) }, style]} />;
}

/* ───── Экран: фон темы + «дымка» сверху ───── */

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Svg width={width} height={640} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        <Defs>
          <RadialGradient id="haze" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={t.haze.color} stopOpacity={t.haze.opacity} />
            <Stop offset="1" stopColor={t.haze.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={320} rx={width / 2 + 90} ry={280} fill="url(#haze)" />
      </Svg>
      <SafeAreaView style={[{ flex: 1 }, style]} edges={['top']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/* ───── Кнопки ───── */

export function Circ({ icon, onPress, label, active, size = 44 }: { icon: IconName; onPress?: () => void; label: string; active?: boolean; size?: number }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, borderWidth: StyleSheet.hairlineWidth, borderColor: t.ln,
        alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.sf2 : 'transparent', opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={size > 44 ? 24 : 20} strokeWidth={1.6} color={t.tx} />
    </Pressable>
  );
}

export function Pill({ children, onPress, label }: { children: ReactNode; onPress?: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: t.ln,
        flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

export function Cta({ title, onPress, disabled, loading, extra, style }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; extra?: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          height: 56, borderRadius: 28, backgroundColor: t.cta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1, shadowColor: t.ctaGlow, shadowOpacity: 1, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.onCta} />
      ) : (
        <>
          <Txt size={17} weight="600" color={t.onCta}>
            {title}
          </Txt>
          {extra ? (
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: t.onCta, opacity: 0.8 }}>{extra}</Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export function Ghost({ title, onPress, style, disabled }: { title: string; onPress: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        { height: 56, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, borderColor: t.ln, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Txt size={17} weight="500">
        {title}
      </Txt>
    </Pressable>
  );
}

/* ───── Контейнеры ───── */

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = { backgroundColor: t.sf, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: t.ln };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.8 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

export function Sep() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.ln }} />;
}

export function Row({ children, style, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Bar({ value, color, style }: { value: number; color: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[{ height: 4, borderRadius: 2, backgroundColor: t.track, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: 4, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={(v) => {
        tap();
        onChange(v);
      }}
      trackColor={{ true: t.tgl, false: t.sf2 }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={t.sf2}
    />
  );
}

export function Seg({ items, value, onChange }: { items: string[]; value: number; onChange: (i: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.sf2, borderRadius: 18, padding: 3 }}>
      {items.map((x, i) => (
        <Pressable
          key={x}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === value }}
          onPress={() => {
            tap();
            onChange(i);
          }}
          style={{ paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: 'center', backgroundColor: i === value ? (t.light ? 'rgba(255,255,255,0.28)' : '#2C2C33') : 'transparent' }}
        >
          <Txt size={13} weight="500" color={i === value ? t.tx : t.mu}>
            {x}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

/* ───── Три кольца: еда (толстое), шаги, опыт (тонкое) — 320 / 16·7·3 / отступы 0·24·38 ───── */

export function Rings({ size, food, steps, xp, dim, children }: { size: number; food: number; steps: number; xp: number; dim?: boolean; children?: ReactNode }) {
  const t = useTheme();
  const k = size / 320;
  const rings = [
    { v: food, color: t.food, w: 16 * k, inset: 0 },
    { v: steps, color: t.steps, w: 7 * k, inset: 24 * k },
    { v: xp, color: t.xp, w: 3 * k, inset: 38 * k },
  ];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.35 : 1 }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {rings.map((r, i) => {
          const rad = size / 2 - r.inset - r.w / 2;
          const C = 2 * Math.PI * rad;
          const v = Math.max(0, Math.min(1, r.v));
          return (
            <G key={i}>
              <Circle cx={size / 2} cy={size / 2} r={rad} stroke={t.track} strokeWidth={r.w} fill="none" />
              {v > 0.005 && (
                <Circle
                  cx={size / 2} cy={size / 2} r={rad} stroke={r.color} strokeWidth={r.w} fill="none" strokeLinecap="round"
                  strokeDasharray={`${C * v} ${C}`} rotation={-90} origin={`${size / 2}, ${size / 2}`}
                />
              )}
            </G>
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

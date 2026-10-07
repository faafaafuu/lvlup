import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { tokens, useTheme } from '@/theme';
import { tap } from '@/lib/haptics';

const { sizes } = tokens.font;

type Tone = 'text' | 'muted' | 'primary' | 'xp' | 'coin' | 'streak' | 'danger' | 'success' | 'warning';

export function T({ size = 'md', tone = 'text', bold, style, ...rest }: TextProps & { size?: keyof typeof sizes; tone?: Tone; bold?: boolean }) {
  const { c } = useTheme();
  const color = tone === 'muted' ? c.textMuted : tone === 'text' ? c.text : c[tone];
  return <Text {...rest} style={[{ color, fontSize: sizes[size], fontWeight: bold ? '700' : '400' }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: tokens.radius.lg, padding: 16, borderWidth: 1, borderColor: c.border }, style]}>
      {children}
    </View>
  );
}

export function Btn({
  title, onPress, kind = 'primary', disabled, loading, style,
}: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const bg = kind === 'primary' ? c.primary : kind === 'danger' ? c.danger : 'transparent';
  const fg = kind === 'ghost' ? c.text : c.onPrimary;
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
          minHeight: 50, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18,
          backgroundColor: bg, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: c.border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: sizes.md, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, style }: { label: string; active?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: tokens.radius.pill,
          backgroundColor: active ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: active ? c.primary : c.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: active ? c.onPrimary : c.text, fontSize: sizes.sm, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({ value, onChange, step = 10, min = 0, suffix = '' }: { value: number; onChange: (v: number) => void; step?: number; min?: number; suffix?: string }) {
  const { c } = useTheme();
  const btn = (label: string, delta: number) => (
    <Pressable
      accessibilityLabel={delta > 0 ? 'Больше' : 'Меньше'}
      onPress={() => {
        tap();
        onChange(Math.max(min, Math.round((value + delta) * 10) / 10));
      }}
      hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {btn('−', -step)}
      <Text style={{ color: c.text, minWidth: 64, textAlign: 'center', fontSize: sizes.md, fontWeight: '600' }}>
        {value}
        {suffix}
      </Text>
      {btn('+', step)}
    </View>
  );
}

export function Bar({ value, max, color, height = 8, style }: { value: number; max: number; color: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: c.surfaceAlt, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 8, marginBottom: 8 }}>
      <T size="lg" bold>
        {children}
      </T>
      {right}
    </Row>
  );
}

export const textInputStyle = (c: { surfaceAlt: string; text: string; border: string }): TextStyle => ({
  backgroundColor: c.surfaceAlt, color: c.text, borderRadius: tokens.radius.md, borderWidth: 1, borderColor: c.border,
  paddingHorizontal: 14, minHeight: 48, fontSize: sizes.md,
});

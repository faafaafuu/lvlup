import { ReactNode } from 'react';
import { Pressable, StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { Button } from '@/design/components';
import { Icon } from '@/design/Icon';
import { fonts, tokens, useTheme } from '@/theme';
import { tap } from '@/lib/haptics';

const { sizes } = tokens.font;

type Tone = 'text' | 'muted' | 'primary' | 'xp' | 'coin' | 'streak' | 'danger' | 'success' | 'warning';

/** display — акцентный шрифт Unbounded для заголовков и чисел (уровень, XP, ккал). */
export function T({ size = 'md', tone = 'text', bold, display, style, ...rest }: TextProps & { size?: keyof typeof sizes; tone?: Tone; bold?: boolean; display?: boolean }) {
  const { c } = useTheme();
  const color = tone === 'muted' ? c.textMuted : tone === 'text' ? c.text : c[tone];
  const font = display ? { fontFamily: bold ? fonts.display : fonts.displayMedium } : { fontWeight: bold ? ('700' as const) : ('400' as const) };
  return <Text {...rest} style={[{ color, fontSize: sizes[size] }, font, style]} />;
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
}: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  const t = useTheme();
  const variant = kind === 'ghost' ? 'secondary' : kind;
  return (
    <Button
      t={t}
      title={title}
      variant={variant}
      disabled={disabled}
      loading={loading}
      style={style}
      onPress={() => {
        tap();
        onPress();
      }}
    />
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
          paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: tokens.radius.pill,
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
  const btn = (icon: 'minus' | 'plus', delta: number) => (
    <Pressable
      accessibilityLabel={delta > 0 ? 'Больше' : 'Меньше'}
      onPress={() => {
        tap();
        onChange(Math.max(min, Math.round((value + delta) * 10) / 10));
      }}
      hitSlop={6}
      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={18} color={c.text} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {btn('minus', -step)}
      <Text style={{ color: c.text, minWidth: 64, textAlign: 'center', fontSize: sizes.md, fontWeight: '600' }}>
        {value}
        {suffix}
      </Text>
      {btn('plus', step)}
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

export function Row({ children, style, gap = 8, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number; accessibilityLabel?: string }) {
  return (
    <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 8, marginBottom: 8 }}>
      <T size="lg" bold display>
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
